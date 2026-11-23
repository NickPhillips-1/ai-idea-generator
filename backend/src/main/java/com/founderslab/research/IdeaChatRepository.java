package com.founderslab.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IdeaChatRepository extends JpaRepository<IdeaChat, UUID> {

    List<IdeaChat> findByFounderIdOrderByCreatedAtDesc(UUID founderId);
}
