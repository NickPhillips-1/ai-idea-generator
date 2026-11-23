package com.founderslab.research;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_chat_turn")
public class IdeaChatTurn {

    @Id
    private UUID id;

    @Column(name = "chat_id", nullable = false)
    private UUID chatId;

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

    protected IdeaChatTurn() {
    }

    public IdeaChatTurn(
            UUID chatId,
            String prompt,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns
    ) {
        this.chatId = chatId;
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

    public UUID getChatId() {
        return chatId;
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
