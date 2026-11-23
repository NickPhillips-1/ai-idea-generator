package com.founderslab.integration.ai;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.stereotype.Component;

/**
 * Used when no model key is configured. It refuses to invent Census figures.
 * A live {@link AIProvider} replaces it when {@code AI_API_KEY} is set.
 */
@Component
@Conditional(UnconfiguredAiProvider.MissingKey.class)
public class UnconfiguredAiProvider implements AIProvider {

    @Override
    public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
        throw new IllegalStateException("AI_API_KEY is not configured.");
    }

    public static final class MissingKey implements Condition {

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return context.getEnvironment().getProperty("AI_API_KEY", "").isBlank();
        }
    }
}
