package com.founderslab.integration.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Used when no model key is configured. It refuses to invent Census figures.
 * A live {@link AIProvider} replaces it when {@code AI_API_KEY} is set.
 */
@Component
@ConditionalOnProperty(name = "AI_API_KEY", havingValue = "", matchIfMissing = true)
public class UnconfiguredAiProvider implements AIProvider {

    @Override
    public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
        throw new IllegalStateException("AI_API_KEY is not configured.");
    }
}
