package com.founderslab.research;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
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
        IdeaChat chat = ideas.researchAndSave(request.prompt());
        return IdeaReading.from(chat, ideas.turns(chat.getId()));
    }

    @PostMapping("/api/v1/ideas/{id}/turns")
    public IdeaReading append(@PathVariable UUID id, @RequestBody IdeaRequest request) {
        IdeaChat chat = ideas.append(id, request.prompt());
        return IdeaReading.from(chat, ideas.turns(chat.getId()));
    }

    @GetMapping("/api/v1/ideas")
    public IdeaChatPage list() {
        List<IdeaChatSummary> items = ideas.list().stream().map(IdeaChatSummary::from).toList();
        return new IdeaChatPage(items, items.size(), 0, items.size());
    }

    @GetMapping("/api/v1/ideas/{id}")
    public IdeaReading get(@PathVariable UUID id) {
        return IdeaReading.from(ideas.get(id), ideas.turns(id));
    }

    @DeleteMapping("/api/v1/ideas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        ideas.delete(id);
    }

    public record IdeaRequest(String prompt) {
    }

    public record IdeaTurn(
            String prompt,
            Instant createdAt,
            String factualSummary,
            String supportingEvidence,
            String aiInterpretation,
            String unknowns
    ) {
        static IdeaTurn from(IdeaChatTurn turn) {
            return new IdeaTurn(
                    turn.getPrompt(),
                    turn.getCreatedAt(),
                    turn.getFactualSummary(),
                    turn.getSupportingEvidence(),
                    turn.getAiInterpretation(),
                    turn.getUnknowns()
            );
        }
    }

    public record IdeaReading(
            UUID id,
            String prompt,
            Instant createdAt,
            List<IdeaTurn> turns
    ) {
        static IdeaReading from(IdeaChat chat, List<IdeaChatTurn> turns) {
            return new IdeaReading(
                    chat.getId(),
                    chat.getPrompt(),
                    chat.getCreatedAt(),
                    turns.stream().map(IdeaTurn::from).toList()
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
