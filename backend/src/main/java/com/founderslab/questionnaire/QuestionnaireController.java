package com.founderslab.questionnaire;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class QuestionnaireController {

    private final QuestionnaireService questionnaires;
    private final ObjectMapper objectMapper;

    public QuestionnaireController(QuestionnaireService questionnaires, ObjectMapper objectMapper) {
        this.questionnaires = questionnaires;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/api/v1/questionnaires")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionnaireResponse submit(@RequestBody SubmitQuestionnaireRequest request) {
        Questionnaire saved = questionnaires.submit(request.templateId(), request.answers());
        return toResponse(saved);
    }

    @GetMapping("/api/v1/questionnaires/{id}")
    public QuestionnaireResponse get(@PathVariable UUID id) {
        return toResponse(questionnaires.get(id));
    }

    @GetMapping("/api/v1/questionnaires")
    public QuestionnairePage list(@RequestParam(required = false) UUID founderId) {
        List<QuestionnaireResponse> items = questionnaires.list(founderId).stream()
                .map(this::toResponse)
                .toList();
        return new QuestionnairePage(items, items.size(), 0, items.size());
    }

    public record SubmitQuestionnaireRequest(UUID templateId, Map<String, String> answers) {
    }

    public record QuestionnaireResponse(
            UUID id,
            UUID founderId,
            UUID templateId,
            String status,
            Map<String, String> answers,
            Instant submittedAt
    ) {
    }

    private QuestionnaireResponse toResponse(Questionnaire questionnaire) {
        return new QuestionnaireResponse(
                questionnaire.getId(),
                questionnaire.getFounderId(),
                questionnaire.getTemplateId(),
                questionnaire.getStatus(),
                objectMapper.readValue(questionnaire.getAnswers(), new TypeReference<Map<String, String>>() {
                }),
                questionnaire.getSubmittedAt()
        );
    }

    public record QuestionnairePage(List<QuestionnaireResponse> items, int limit, int offset, int total) {
    }
}
