package com.founderslab.research;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "research_job")
public class ResearchJob {

    @Id
    private UUID id;

    @Column(name = "direction_id", nullable = false)
    private UUID directionId;

    @Column(name = "approved_research_source_id", nullable = false)
    private UUID approvedResearchSourceId;

    @Column(nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source_config", nullable = false)
    private String sourceConfig;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column
    private String error;

    @Column(name = "token_usage")
    private Integer tokenUsage;

    @Column(name = "estimated_cost")
    private java.math.BigDecimal estimatedCost;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private int version;

    protected ResearchJob() {
    }

    public ResearchJob(UUID directionId, UUID approvedResearchSourceId, String sourceConfig, String idempotencyKey) {
        this.id = UUID.randomUUID();
        this.directionId = directionId;
        this.approvedResearchSourceId = approvedResearchSourceId;
        this.status = "PENDING";
        this.sourceConfig = sourceConfig;
        this.attemptCount = 0;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = Instant.now();
        this.version = 0;
    }

    public UUID getId() {
        return id;
    }

    public UUID getDirectionId() {
        return directionId;
    }

    public UUID getApprovedResearchSourceId() {
        return approvedResearchSourceId;
    }

    public String getSourceConfig() {
        return sourceConfig;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Integer getTokenUsage() {
        return tokenUsage;
    }

    public void setTokenUsage(Integer tokenUsage) {
        this.tokenUsage = tokenUsage;
    }

    public java.math.BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(java.math.BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(int attemptCount) {
        this.attemptCount = attemptCount;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }
}
