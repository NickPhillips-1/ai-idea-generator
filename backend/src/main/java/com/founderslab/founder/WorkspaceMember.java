package com.founderslab.founder;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "workspace_member")
public class WorkspaceMember {

    public static final String ROLE_FOUNDER = "FOUNDER";

    @EmbeddedId
    private WorkspaceMemberId id;

    @Column(nullable = false)
    private String role;

    protected WorkspaceMember() {
    }

    public WorkspaceMember(WorkspaceMemberId id) {
        this.id = id;
        this.role = ROLE_FOUNDER;
    }

    public WorkspaceMemberId getId() {
        return id;
    }

    public String getRole() {
        return role;
    }
}
