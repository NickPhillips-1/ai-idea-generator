package com.founderslab.opportunity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductConceptRepository extends JpaRepository<ProductConcept, UUID> {

    List<ProductConcept> findByOpportunityIdOrderByCreatedAtAsc(UUID opportunityId);
}
