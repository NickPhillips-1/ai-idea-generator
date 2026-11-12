package com.founderslab.alignment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "founder_alignment")
public class FounderAlignment {

    @Id
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "shared_interests", nullable = false)
    private String sharedInterests;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "complementary_skills", nullable = false)
    private String complementarySkills;

    @Column(name = "ai_explanation", nullable = false)
    private String aiExplanation;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FounderAlignment() {
    }

    public FounderAlignment(UUID workspaceId, String sharedInterests, String complementarySkills, String aiExplanation) {
        this.workspaceId = workspaceId;
        this.status = "READY";
        this.sharedInterests = sharedInterests;
        this.complementarySkills = complementarySkills;
        this.aiExplanation = aiExplanation;
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

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public String getStatus() {
        return status;
    }

    public String getSharedInterests() {
        return sharedInterests;
    }

    public String getComplementarySkills() {
        return complementarySkills;
    }

    public String getAiExplanation() {
        return aiExplanation;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
