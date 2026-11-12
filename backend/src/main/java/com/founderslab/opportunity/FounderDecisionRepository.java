package com.founderslab.opportunity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FounderDecisionRepository extends JpaRepository<FounderDecision, UUID> {

    List<FounderDecision> findByOpportunityIdOrderByCreatedAtAsc(UUID opportunityId);
}
