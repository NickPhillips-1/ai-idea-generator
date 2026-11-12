package com.founderslab.questionnaire;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "questionnaire")
public class Questionnaire {

    @Id
    private UUID id;

    @Column(name = "founder_id", nullable = false)
    private UUID founderId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String answers;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private int version;

    protected Questionnaire() {
    }

    public Questionnaire(UUID founderId, UUID templateId, String answers) {
        this.founderId = founderId;
        this.templateId = templateId;
        this.answers = answers;
        this.status = "SUBMITTED";
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        submittedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public UUID getFounderId() {
        return founderId;
    }

    public UUID getTemplateId() {
        return templateId;
    }

    public String getStatus() {
        return status;
    }

    public String getAnswers() {
        return answers;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
