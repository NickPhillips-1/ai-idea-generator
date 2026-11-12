package com.founderslab.questionnaire;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuestionnaireTemplateRepository extends JpaRepository<QuestionnaireTemplate, UUID> {
}
