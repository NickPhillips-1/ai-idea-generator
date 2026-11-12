package com.founderslab.opportunity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_concept")
public class ProductConcept {

    @Id
    private UUID id;

    @Column(name = "opportunity_id", nullable = false)
    private UUID opportunityId;

    @Column(nullable = false)
    private String description;

    @Column(name = "target_buyers", nullable = false)
    private String targetBuyers;

    @Column(nullable = false)
    private String differentiation;

    @Column(name = "estimated_costs", nullable = false)
    private String estimatedCosts;

    @Column(nullable = false)
    private String feasibility;

    @Column(name = "business_type", nullable = false)
    private String businessType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductConcept() {
    }

    public ProductConcept(
            UUID opportunityId,
            String description,
            String targetBuyers,
            String differentiation,
            String estimatedCosts,
            String feasibility,
            String businessType
    ) {
        this.opportunityId = opportunityId;
        this.description = description;
        this.targetBuyers = targetBuyers;
        this.differentiation = differentiation;
        this.estimatedCosts = estimatedCosts;
        this.feasibility = feasibility;
        this.businessType = businessType;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getOpportunityId() {
        return opportunityId;
    }

    public String getDescription() {
        return description;
    }

    public String getTargetBuyers() {
        return targetBuyers;
    }

    public String getDifferentiation() {
        return differentiation;
    }

    public String getEstimatedCosts() {
        return estimatedCosts;
    }

    public String getFeasibility() {
        return feasibility;
    }

    public String getBusinessType() {
        return businessType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
