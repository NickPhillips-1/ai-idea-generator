package com.founderslab.integration.sources;

public record ResearchData(
        String originalReference,
        String payload,
        String payloadHash
) {
}
