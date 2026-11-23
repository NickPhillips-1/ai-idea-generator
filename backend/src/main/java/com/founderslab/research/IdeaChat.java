package com.founderslab.research;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_chat")
public class IdeaChat {

    @Id
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "founder_id", nullable = false)
    private UUID founderId;

    @Column(nullable = false)
    private String prompt;

    @Column(name = "factual_summary", nullable = false)
    private String factualSummary;

    @Column(name = "supporting_evidence", nullable = false)
    private String supportingEvidence;

    @Column(name = "ai_interpretation", nullable = false)
    private String aiInterpretation;

    @Column(nullable = false)
    private String unknowns;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IdeaChat() {
    }

    public IdeaChat(
            UUID workspaceId,
            UUID founderId,
            String prompt,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns
    ) {
        this.workspaceId = workspaceId;
        this.founderId = founderId;
        this.prompt = prompt;
        this.factualSummary = factualSummary;
        this.supportingEvidence = supportingEvidence;
        this.aiInterpretation = aiInterpretation;
        this.unknowns = unknowns;
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

    public UUID getFounderId() {
        return founderId;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getFactualSummary() {
        return factualSummary;
    }

    public String getSupportingEvidence() {
        return supportingEvidence;
    }

    public String getAiInterpretation() {
        return aiInterpretation;
    }

    public String getUnknowns() {
        return unknowns;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
