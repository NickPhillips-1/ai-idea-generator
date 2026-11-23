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

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IdeaChat() {
    }

    public IdeaChat(UUID workspaceId, UUID founderId, String prompt) {
        this.workspaceId = workspaceId;
        this.founderId = founderId;
        this.prompt = prompt;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
