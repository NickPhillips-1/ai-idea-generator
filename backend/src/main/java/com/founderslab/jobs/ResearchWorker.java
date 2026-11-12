package com.founderslab.jobs;

import com.founderslab.evidence.ResearchFinding;
import com.founderslab.evidence.ResearchFindingRepository;
import com.founderslab.evidence.ResearchSourceRecord;
import com.founderslab.evidence.ResearchSourceRepository;
import com.founderslab.integration.ai.AIProvider;
import com.founderslab.integration.ai.FindingDraft;
import com.founderslab.integration.sources.CensusCountyBusinessPatternsAdapter;
import com.founderslab.integration.sources.ResearchData;
import com.founderslab.integration.sources.ResearchRequest;
import com.founderslab.integration.sources.ResearchSourceAdapter;
import com.founderslab.research.ResearchJob;
import com.founderslab.research.ResearchJobRepository;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ResearchWorker {

    private final EntityManager entityManager;
    private final ResearchJobRepository jobs;
    private final ResearchSourceRepository sources;
    private final ResearchFindingRepository findings;
    private final ResearchSourceAdapter adapter;
    private final AIProvider aiProvider;
    private final Validator validator;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public ResearchWorker(
            EntityManager entityManager,
            ResearchJobRepository jobs,
            ResearchSourceRepository sources,
            ResearchFindingRepository findings,
            ResearchSourceAdapter adapter,
            AIProvider aiProvider,
            Validator validator,
            JdbcTemplate jdbc,
            ObjectMapper objectMapper
    ) {
        this.entityManager = entityManager;
        this.jobs = jobs;
        this.sources = sources;
        this.findings = findings;
        this.adapter = adapter;
        this.aiProvider = aiProvider;
        this.validator = validator;
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UUID claim() {
        List<UUID> ids = entityManager.createNativeQuery(
                "select id from research_job where status = 'PENDING' order by created_at for update skip locked limit 1",
                UUID.class
        ).getResultList();
        if (ids.isEmpty()) {
            return null;
        }
        ResearchJob job = jobs.findById(ids.getFirst()).orElseThrow();
        job.setStatus("RUNNING");
        job.setStartedAt(Instant.now());
        job.setAttemptCount(job.getAttemptCount() + 1);
        job.setVersion(job.getVersion() + 1);
        return job.getId();
    }

    @Transactional
    public void execute(UUID jobId) {
        ResearchJob job = jobs.findById(jobId).orElseThrow();
        if (!"RUNNING".equals(job.getStatus())) {
            return;
        }
        try {
            String baseUrl = jdbc.queryForObject(
                    "select base_url from approved_research_source where id = ?",
                    String.class,
                    job.getApprovedResearchSourceId()
            );
            JsonNode config = objectMapper.readTree(job.getSourceConfig());
            ResearchData data = adapter.collect(new ResearchRequest(
                    baseUrl,
                    config.path("year").asString(),
                    config.path("naics").asString(),
                    config.path("state").asString()
            ));
            FindingDraft draft = aiProvider.generateStructuredResponse(
                    "Summarize only this Census payload. Do not invent sources.\n" + data.payload(),
                    FindingDraft.class
            );
            if (!validator.validate(draft).isEmpty()) {
                throw new IllegalStateException("The model response failed validation.");
            }
            String unknowns = draft.getUnknowns();
            if (!unknowns.contains(CensusCountyBusinessPatternsAdapter.CENSUS_LIMIT)) {
                unknowns = unknowns + " " + CensusCountyBusinessPatternsAdapter.CENSUS_LIMIT;
            }
            ResearchSourceRecord source = sources.save(new ResearchSourceRecord(
                    job.getApprovedResearchSourceId(),
                    job.getId(),
                    config.toString(),
                    data.originalReference(),
                    data.payloadHash()
            ));
            findings.save(new ResearchFinding(
                    job.getDirectionId(),
                    source.getId(),
                    draft.getFactualSummary(),
                    draft.getSupportingEvidence(),
                    draft.getAiInterpretation(),
                    unknowns
            ));
            job.setStatus("SUCCEEDED");
            job.setCompletedAt(Instant.now());
            job.setError(null);
        } catch (RuntimeException exception) {
            job.setStatus(job.getAttemptCount() >= 3 ? "FAILED" : "PENDING");
            job.setError(exception.getMessage());
            if ("FAILED".equals(job.getStatus())) {
                job.setCompletedAt(Instant.now());
            }
        }
        job.setVersion(job.getVersion() + 1);
    }
}
