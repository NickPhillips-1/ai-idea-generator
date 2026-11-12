package com.founderslab.evidence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "research_finding")
public class ResearchFinding {

    @Id
    private UUID id;

    @Column(name = "direction_id", nullable = false)
    private UUID directionId;

    @Column(name = "research_source_id", nullable = false)
    private UUID researchSourceId;

    @Column(name = "factual_summary", nullable = false)
    private String factualSummary;

    @Column(name = "supporting_evidence", nullable = false)
    private String supportingEvidence;

    @Column(name = "ai_interpretation", nullable = false)
    private String aiInterpretation;

    @Column(nullable = false)
    private String unknowns;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ResearchFinding() {
    }

    public ResearchFinding(
            UUID directionId,
            UUID researchSourceId,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns
    ) {
        this.id = UUID.randomUUID();
        this.directionId = directionId;
        this.researchSourceId = researchSourceId;
        this.factualSummary = factualSummary;
        this.supportingEvidence = supportingEvidence;
        this.aiInterpretation = aiInterpretation;
        this.unknowns = unknowns;
        this.verificationStatus = "UNREVIEWED";
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public UUID getResearchSourceId() {
        return researchSourceId;
    }

    public UUID getDirectionId() {
        return directionId;
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

    public String getVerificationStatus() {
        return verificationStatus;
    }
}
