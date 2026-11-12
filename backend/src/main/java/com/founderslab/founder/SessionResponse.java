package com.founderslab.founder;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

public record SessionResponse(
        UUID founderId,
        String email,
        String name,
        UUID workspaceId,
        String role,
        @JsonInclude(JsonInclude.Include.NON_NULL) String pictureUrl
) {
}
