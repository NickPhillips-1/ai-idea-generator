package com.founderslab.opportunity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "opportunity")
public class Opportunity {

    @Id
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false)
    private String title;

    @Column(name = "customer_problem", nullable = false)
    private String customerProblem;

    @Column(name = "target_customer", nullable = false)
    private String targetCustomer;

    @Column(nullable = false)
    private String status;

    @Column(name = "evaluation_summary", nullable = false)
    private String evaluationSummary;

    @Column(name = "business_type", nullable = false)
    private String businessType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private int version;

    protected Opportunity() {
    }

    public Opportunity(
            UUID workspaceId,
            String title,
            String customerProblem,
            String targetCustomer,
            String evaluationSummary,
            String businessType
    ) {
        this.workspaceId = workspaceId;
        this.title = title;
        this.customerProblem = customerProblem;
        this.targetCustomer = targetCustomer;
        this.status = "DRAFT";
        this.evaluationSummary = evaluationSummary;
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

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public String getTitle() {
        return title;
    }

    public String getCustomerProblem() {
        return customerProblem;
    }

    public String getTargetCustomer() {
        return targetCustomer;
    }

    public String getStatus() {
        return status;
    }

    public String getEvaluationSummary() {
        return evaluationSummary;
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

    public int getVersion() {
        return version;
    }
}
