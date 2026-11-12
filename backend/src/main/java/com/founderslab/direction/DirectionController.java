package com.founderslab.direction;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class DirectionController {

    private final DirectionService directions;

    public DirectionController(DirectionService directions) {
        this.directions = directions;
    }

    @PostMapping("/api/v1/directions")
    @ResponseStatus(HttpStatus.CREATED)
    public DirectionResponse create(@RequestBody CreateDirectionRequest request) {
        ResearchDirection direction = directions.create(
                request.alignmentId(),
                request.title(),
                request.description(),
                request.origin()
        );
        return DirectionResponse.from(direction);
    }

    @GetMapping("/api/v1/directions/{id}")
    public DirectionResponse get(@PathVariable UUID id) {
        return DirectionResponse.from(directions.get(id));
    }

    public record CreateDirectionRequest(UUID alignmentId, String title, String description, String origin) {
    }

    public record DirectionResponse(UUID id, String title, String status, int version) {
        static DirectionResponse from(ResearchDirection direction) {
            return new DirectionResponse(direction.getId(), direction.getTitle(), direction.getStatus(), direction.getVersion());
        }
    }
}
