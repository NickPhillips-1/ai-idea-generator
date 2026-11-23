package com.founderslab.integration.ai;

import com.founderslab.common.ModelName;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.stereotype.Component;

@Component
@Conditional(OpenAiProvider.Configured.class)
public class OpenAiProvider implements AIProvider {

    private final ChatClient chatClient;

    public OpenAiProvider(
            @Value("${AI_API_KEY}") String apiKey,
            @Value("${AI_MODEL:}") String model
    ) {
        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .options(OpenAiChatOptions.builder()
                        .apiKey(apiKey)
                        .model(ModelName.resolve(model))
                        .build())
                .build();
        this.chatClient = ChatClient.create(chatModel);
    }

    @Override
    public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
        return chatClient.prompt().user(prompt).call().entity(responseType);
    }

    public static final class Configured implements Condition {

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            String apiKey = context.getEnvironment().getProperty("AI_API_KEY", "");
            String fixtures = context.getEnvironment().getProperty("founderslab.e2e.fixtures", "false");
            return !apiKey.isBlank() && !"true".equals(fixtures);
        }
    }
}
