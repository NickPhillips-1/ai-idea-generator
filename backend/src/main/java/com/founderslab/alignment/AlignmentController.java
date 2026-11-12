package com.founderslab.alignment;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
public class AlignmentController {

    private final AlignmentService alignments;
    private final ObjectMapper objectMapper;

    public AlignmentController(AlignmentService alignments, ObjectMapper objectMapper) {
        this.alignments = alignments;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/api/v1/alignments/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public AlignmentResponse generate(@RequestBody GenerateAlignmentRequest request) {
        AlignmentService.GeneratedAlignment generated = alignments.generate(request.questionnaireIds());
        FounderAlignment alignment = generated.alignment();
        return new AlignmentResponse(
                alignment.getId(),
                alignment.getStatus(),
                generated.founderIds(),
                generated.questionnaireIds(),
                objectMapper.readValue(alignment.getSharedInterests(), new TypeReference<List<String>>() {
                }),
                objectMapper.readValue(alignment.getComplementarySkills(), new TypeReference<List<String>>() {
                }),
                alignment.getAiExplanation(),
                alignment.getCreatedAt()
        );
    }

    public record GenerateAlignmentRequest(List<UUID> questionnaireIds) {
    }

    public record AlignmentResponse(
            UUID id,
            String status,
            List<UUID> participatingFounderIds,
            List<UUID> questionnaireIds,
            List<String> sharedInterests,
            List<String> complementarySkills,
            String aiExplanation,
            Instant createdAt
    ) {
    }
}
