package com.founderslab.direction;

import com.founderslab.alignment.FounderAlignment;
import com.founderslab.alignment.FounderAlignmentRepository;
import com.founderslab.common.exception.ApiException;
import com.founderslab.founder.CurrentFounder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
public class DirectionService {

    private static final Set<String> ORIGINS = Set.of("AI", "FOUNDER", "EXTERNAL");

    private final ResearchDirectionRepository directions;
    private final FounderAlignmentRepository alignments;
    private final CurrentFounder currentFounder;

    public DirectionService(
            ResearchDirectionRepository directions,
            FounderAlignmentRepository alignments,
            CurrentFounder currentFounder
    ) {
        this.directions = directions;
        this.alignments = alignments;
        this.currentFounder = currentFounder;
    }

    @Transactional
    public ResearchDirection create(UUID alignmentId, String title, String description, String origin) {
        if (!ORIGINS.contains(origin)) {
            throw ApiException.badRequest("Origin is not allowed.", java.util.List.of(
                    new com.founderslab.common.response.FieldErrorDetail("origin", "invalid")
            ));
        }
        UUID workspaceId = currentFounder.requireMembership().getId().getWorkspaceId();
        FounderAlignment alignment = alignments.findById(alignmentId)
                .orElseThrow(() -> ApiException.notFound("Alignment was not found."));
        if (!alignment.getWorkspaceId().equals(workspaceId)) {
            throw ApiException.notFound("Alignment was not found.");
        }
        return directions.save(new ResearchDirection(
                workspaceId,
                alignmentId,
                title,
                description,
                origin,
                currentFounder.requireFounder().getId()
        ));
    }

    @Transactional(readOnly = true)
    public ResearchDirection get(UUID id) {
        ResearchDirection direction = directions.findById(id)
                .orElseThrow(() -> ApiException.notFound("Research direction was not found."));
        if (!direction.getWorkspaceId().equals(currentFounder.requireMembership().getId().getWorkspaceId())) {
            throw ApiException.notFound("Research direction was not found.");
        }
        return direction;
    }
}
