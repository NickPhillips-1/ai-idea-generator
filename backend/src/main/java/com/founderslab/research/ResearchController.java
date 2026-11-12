package com.founderslab.research;

import com.founderslab.direction.DirectionService;
import com.founderslab.evidence.ResearchFinding;
import com.founderslab.evidence.ResearchFindingRepository;
import com.founderslab.evidence.ResearchSourceRecord;
import com.founderslab.evidence.ResearchSourceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
public class ResearchController {

    private final ResearchService research;
    private final ResearchFindingRepository findings;
    private final ResearchSourceRepository sources;
    private final DirectionService directions;

    public ResearchController(
            ResearchService research,
            ResearchFindingRepository findings,
            ResearchSourceRepository sources,
            DirectionService directions
    ) {
        this.research = research;
        this.findings = findings;
        this.sources = sources;
        this.directions = directions;
    }

    @PostMapping("/api/v1/directions/{id}/research")
    public ResponseEntity<?> start(
            @PathVariable UUID id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody StartResearchRequest request
    ) {
        ResearchService.Started started = research.start(id, request.approvedResearchSourceId(), idempotencyKey);
        if (started.created()) {
            return ResponseEntity.accepted().body(new AcceptedJob(started.job().getId(), started.job().getStatus()));
        }
        return ResponseEntity.ok(JobResponse.from(started.job()));
    }

    @GetMapping("/api/v1/research-jobs/{id}")
    public JobResponse job(@PathVariable UUID id) {
        return JobResponse.from(research.get(id));
    }

    @GetMapping("/api/v1/directions/{id}/findings")
    public FindingsPage findings(@PathVariable UUID id) {
        directions.get(id);
        List<FindingResponse> items = findings.findByDirectionId(id).stream().map(finding -> {
            ResearchSourceRecord source = sources.findById(finding.getResearchSourceId()).orElseThrow();
            return FindingResponse.from(finding, source);
        }).toList();
        return new FindingsPage(items, items.size(), 0, items.size());
    }

    public record StartResearchRequest(UUID approvedResearchSourceId) {
    }

    public record AcceptedJob(UUID jobId, String status) {
    }

    public record TokenUsage(int promptTokens, int completionTokens, int totalTokens) {
    }

    public record JobResponse(
            UUID id,
            UUID directionId,
            String status,
            int attemptCount,
            Instant startedAt,
            Instant completedAt,
            String error,
            TokenUsage tokenUsage,
            BigDecimal estimatedCost
    ) {
        static JobResponse from(ResearchJob job) {
            TokenUsage usage = job.getTokenUsage() == null
                    ? null
                    : new TokenUsage(0, 0, job.getTokenUsage());
            return new JobResponse(
                    job.getId(),
                    job.getDirectionId(),
                    job.getStatus(),
                    job.getAttemptCount(),
                    job.getStartedAt(),
                    job.getCompletedAt(),
                    job.getError(),
                    usage,
                    job.getEstimatedCost()
            );
        }
    }

    public record FindingResponse(
            UUID id,
            UUID directionId,
            UUID researchSourceId,
            String originalReference,
            Instant retrievedAt,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns,
            String verificationStatus
    ) {
        static FindingResponse from(ResearchFinding finding, ResearchSourceRecord source) {
            return new FindingResponse(
                    finding.getId(),
                    finding.getDirectionId(),
                    finding.getResearchSourceId(),
                    source.getOriginalReference(),
                    source.getRetrievedAt(),
                    finding.getFactualSummary(),
                    finding.getSupportingEvidence(),
                    finding.getAiInterpretation(),
                    finding.getUnknowns(),
                    finding.getVerificationStatus()
            );
        }
    }

    public record FindingsPage(List<FindingResponse> items, int limit, int offset, int total) {
    }
}
