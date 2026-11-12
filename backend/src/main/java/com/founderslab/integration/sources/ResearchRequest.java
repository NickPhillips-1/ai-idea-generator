package com.founderslab.integration.sources;

public record ResearchRequest(
        String baseUrl,
        String year,
        String naics,
        String state
) {
}
