package com.founderslab.evidence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "research_source")
public class ResearchSourceRecord {

    @Id
    private UUID id;

    @Column(name = "approved_research_source_id", nullable = false)
    private UUID approvedResearchSourceId;

    @Column(name = "research_job_id", nullable = false)
    private UUID researchJobId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String request;

    @Column(name = "original_reference", nullable = false)
    private String originalReference;

    @Column(name = "payload_hash", nullable = false)
    private String payloadHash;

    @Column(name = "retrieved_at", nullable = false)
    private Instant retrievedAt;

    protected ResearchSourceRecord() {
    }

    public ResearchSourceRecord(
            UUID approvedResearchSourceId,
            UUID researchJobId,
            String request,
            String originalReference,
            String payloadHash
    ) {
        this.id = UUID.randomUUID();
        this.approvedResearchSourceId = approvedResearchSourceId;
        this.researchJobId = researchJobId;
        this.request = request;
        this.originalReference = originalReference;
        this.payloadHash = payloadHash;
        this.retrievedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getOriginalReference() {
        return originalReference;
    }

    public Instant getRetrievedAt() {
        return retrievedAt;
    }
}
