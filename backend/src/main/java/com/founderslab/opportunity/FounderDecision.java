package com.founderslab.opportunity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "founder_decision")
public class FounderDecision {

    @Id
    private UUID id;

    @Column(name = "opportunity_id", nullable = false)
    private UUID opportunityId;

    @Column(name = "founder_id", nullable = false)
    private UUID founderId;

    @Column(nullable = false)
    private String decision;

    @Column(nullable = false)
    private String rationale;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FounderDecision() {
    }

    public FounderDecision(UUID opportunityId, UUID founderId, String decision, String rationale) {
        this.opportunityId = opportunityId;
        this.founderId = founderId;
        this.decision = decision;
        this.rationale = rationale;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getOpportunityId() {
        return opportunityId;
    }

    public UUID getFounderId() {
        return founderId;
    }

    public String getDecision() {
        return decision;
    }

    public String getRationale() {
        return rationale;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
