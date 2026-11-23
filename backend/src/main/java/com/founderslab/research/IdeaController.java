package com.founderslab.research;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
public class IdeaController {

    private final IdeaService ideas;

    public IdeaController(IdeaService ideas) {
        this.ideas = ideas;
    }

    @PostMapping("/api/v1/ideas")
    public IdeaReading research(@RequestBody IdeaRequest request) {
        return IdeaReading.from(ideas.researchAndSave(request.prompt()));
    }

    @GetMapping("/api/v1/ideas")
    public IdeaChatPage list() {
        List<IdeaChatSummary> items = ideas.list().stream().map(IdeaChatSummary::from).toList();
        return new IdeaChatPage(items, items.size(), 0, items.size());
    }

    @GetMapping("/api/v1/ideas/{id}")
    public IdeaReading get(@PathVariable UUID id) {
        return IdeaReading.from(ideas.get(id));
    }

    public record IdeaRequest(String prompt) {
    }

    public record IdeaReading(
            UUID id,
            String prompt,
            Instant createdAt,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns
    ) {
        static IdeaReading from(IdeaChat chat) {
            return new IdeaReading(
                    chat.getId(),
                    chat.getPrompt(),
                    chat.getCreatedAt(),
                    chat.getFactualSummary(),
                    chat.getSupportingEvidence(),
                    chat.getAiInterpretation(),
                    chat.getUnknowns()
            );
        }
    }

    public record IdeaChatSummary(UUID id, String prompt, Instant createdAt) {
        static IdeaChatSummary from(IdeaChat chat) {
            return new IdeaChatSummary(chat.getId(), chat.getPrompt(), chat.getCreatedAt());
        }
    }

    public record IdeaChatPage(List<IdeaChatSummary> items, int limit, int offset, int total) {
    }
}
