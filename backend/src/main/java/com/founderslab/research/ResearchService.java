package com.founderslab.research;

import com.founderslab.common.exception.ApiException;
import com.founderslab.direction.DirectionService;
import com.founderslab.direction.ResearchDirection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ResearchService {

    private final ResearchJobRepository jobs;
    private final DirectionService directions;
    private final JdbcTemplate jdbc;
    private final int maxJobsPerHour;
    private final BigDecimal maxEstimatedCost;

    public ResearchService(
            ResearchJobRepository jobs,
            DirectionService directions,
            JdbcTemplate jdbc,
            @Value("${founderslab.research.max-jobs-per-hour:30}") int maxJobsPerHour,
            @Value("${founderslab.research.max-estimated-cost:25}") BigDecimal maxEstimatedCost
    ) {
        this.jobs = jobs;
        this.directions = directions;
        this.jdbc = jdbc;
        this.maxJobsPerHour = maxJobsPerHour;
        this.maxEstimatedCost = maxEstimatedCost;
    }

    @Transactional
    public Started start(UUID directionId, UUID approvedResearchSourceId, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw ApiException.badRequest("Idempotency-Key is required.", java.util.List.of(
                    new com.founderslab.common.response.FieldErrorDetail("Idempotency-Key", "required")
            ));
        }
        if (idempotencyKey.length() > 200) {
            throw ApiException.badRequest("Idempotency-Key is too long.", java.util.List.of(
                    new com.founderslab.common.response.FieldErrorDetail("Idempotency-Key", "at most 200 characters")
            ));
        }
        ResearchDirection direction = directions.get(directionId);
        Integer sources = jdbc.queryForObject(
                "select count(*) from approved_research_source where id = ?",
                Integer.class,
                approvedResearchSourceId
        );
        if (sources == null || sources == 0) {
            throw ApiException.notFound("Approved research source was not found.");
        }
        var existing = jobs.findByDirectionIdAndIdempotencyKey(directionId, idempotencyKey);
        if (existing.isPresent()) {
            ResearchJob job = existing.get();
            if (!job.getApprovedResearchSourceId().equals(approvedResearchSourceId)) {
                throw ApiException.conflict("Idempotency-Key was already used with a different research source.");
            }
            return new Started(job, false);
        }
        if (jobs.countByDirectionIdAndStatus(direction.getId(), "RUNNING") > 0) {
            throw ApiException.conflict("A research job for this direction is already running.");
        }
        Long recentJobs = jdbc.queryForObject(
                "select count(*) from research_job j join research_direction d on d.id = j.direction_id "
                        + "where d.workspace_id = ? and j.created_at > now() - interval '1 hour'",
                Long.class,
                direction.getWorkspaceId()
        );
        if (recentJobs != null && recentJobs >= maxJobsPerHour) {
            throw ApiException.tooManyRequests("The research rate for this workspace has been reached.");
        }
        BigDecimal spent = jdbc.queryForObject(
                "select coalesce(sum(j.estimated_cost), 0) from research_job j "
                        + "join research_direction d on d.id = j.direction_id where d.workspace_id = ?",
                BigDecimal.class,
                direction.getWorkspaceId()
        );
        if (spent != null && spent.compareTo(maxEstimatedCost) >= 0) {
            throw ApiException.tooManyRequests("The research cost cap for this workspace has been reached.");
        }
        String config = "{\"year\":\"2022\",\"naics\":\"31-33\",\"state\":\"06\"}";
        try {
            ResearchJob job = jobs.saveAndFlush(new ResearchJob(direction.getId(), approvedResearchSourceId, config, idempotencyKey));
            return new Started(job, true);
        } catch (DataIntegrityViolationException exception) {
            ResearchJob job = jobs.findByDirectionIdAndIdempotencyKey(directionId, idempotencyKey)
                    .orElseThrow(() -> exception);
            return new Started(job, false);
        }
    }

    @Transactional(readOnly = true)
    public ResearchJob get(UUID id) {
        ResearchJob job = jobs.findById(id).orElseThrow(() -> ApiException.notFound("Research job was not found."));
        directions.get(job.getDirectionId());
        return job;
    }

    public record Started(ResearchJob job, boolean created) {
    }
}
