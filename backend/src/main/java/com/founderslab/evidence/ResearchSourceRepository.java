package com.founderslab.evidence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ResearchSourceRepository extends JpaRepository<ResearchSourceRecord, UUID> {
}
