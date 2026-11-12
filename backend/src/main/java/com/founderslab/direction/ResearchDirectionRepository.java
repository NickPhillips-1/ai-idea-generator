package com.founderslab.direction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ResearchDirectionRepository extends JpaRepository<ResearchDirection, UUID> {
}
