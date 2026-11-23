package com.founderslab.research;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IdeaController {

    private final IdeaService ideas;

    public IdeaController(IdeaService ideas) {
        this.ideas = ideas;
    }

    @PostMapping("/api/v1/ideas")
    public IdeaService.IdeaReading research(@RequestBody IdeaRequest request) {
        return ideas.research(request.prompt());
    }

    public record IdeaRequest(String prompt) {
    }
}
