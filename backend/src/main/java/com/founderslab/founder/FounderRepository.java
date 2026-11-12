package com.founderslab.founder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FounderRepository extends JpaRepository<Founder, UUID> {

    Optional<Founder> findByEmailIgnoreCase(String email);
}
