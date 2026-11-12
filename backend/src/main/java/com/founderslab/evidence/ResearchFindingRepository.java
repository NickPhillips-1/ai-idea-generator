package com.founderslab.evidence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResearchFindingRepository extends JpaRepository<ResearchFinding, UUID> {

    List<ResearchFinding> findByDirectionId(UUID directionId);
}
