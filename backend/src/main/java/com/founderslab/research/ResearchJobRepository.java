package com.founderslab.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResearchJobRepository extends JpaRepository<ResearchJob, UUID> {

    Optional<ResearchJob> findByDirectionIdAndIdempotencyKey(UUID directionId, String idempotencyKey);

    long countByDirectionIdAndStatus(UUID directionId, String status);
}
