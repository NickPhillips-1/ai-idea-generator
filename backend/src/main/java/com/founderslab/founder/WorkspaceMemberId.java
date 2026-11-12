package com.founderslab.founder;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class WorkspaceMemberId implements Serializable {

    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Column(name = "founder_id")
    private UUID founderId;

    protected WorkspaceMemberId() {
    }

    public WorkspaceMemberId(UUID workspaceId, UUID founderId) {
        this.workspaceId = workspaceId;
        this.founderId = founderId;
    }

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public UUID getFounderId() {
        return founderId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof WorkspaceMemberId that)) {
            return false;
        }
        return Objects.equals(workspaceId, that.workspaceId) && Objects.equals(founderId, that.founderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(workspaceId, founderId);
    }
}
