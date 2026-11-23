package com.founderslab.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IdeaChatTurnRepository extends JpaRepository<IdeaChatTurn, UUID> {

    List<IdeaChatTurn> findByChatIdOrderByCreatedAtAsc(UUID chatId);
}
