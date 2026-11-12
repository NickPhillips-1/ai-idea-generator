package com.founderslab.questionnaire;

import com.founderslab.common.exception.ApiException;
import com.founderslab.common.response.FieldErrorDetail;
import com.founderslab.founder.CurrentFounder;
import com.founderslab.founder.WorkspaceMember;
import com.founderslab.founder.WorkspaceMemberId;
import com.founderslab.founder.WorkspaceMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QuestionnaireService {

    private final QuestionnaireRepository questionnaires;
    private final QuestionnaireTemplateRepository templates;
    private final CurrentFounder currentFounder;
    private final WorkspaceMemberRepository members;
    private final ObjectMapper objectMapper;

    public QuestionnaireService(
            QuestionnaireRepository questionnaires,
            QuestionnaireTemplateRepository templates,
            CurrentFounder currentFounder,
            WorkspaceMemberRepository members,
            ObjectMapper objectMapper
    ) {
        this.questionnaires = questionnaires;
        this.templates = templates;
        this.currentFounder = currentFounder;
        this.members = members;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Questionnaire submit(UUID templateId, Map<String, String> answers) {
        QuestionnaireTemplate template = templates.findById(templateId)
                .orElseThrow(() -> ApiException.notFound("Questionnaire template was not found."));
        List<FieldErrorDetail> errors = missingAnswers(template.getDefinition(), answers);
        if (!errors.isEmpty()) {
            throw ApiException.unprocessable("Answers do not satisfy the template.", errors);
        }
        return questionnaires.save(new Questionnaire(
                currentFounder.requireFounder().getId(),
                template.getId(),
                objectMapper.writeValueAsString(answers)
        ));
    }

    @Transactional(readOnly = true)
    public Questionnaire get(UUID id) {
        Questionnaire questionnaire = questionnaires.findById(id)
                .orElseThrow(() -> ApiException.notFound("Questionnaire was not found."));
        var callerWorkspace = currentFounder.requireMembership().getId().getWorkspaceId();
        WorkspaceMember author = members.findFirstByIdFounderId(questionnaire.getFounderId())
                .orElseThrow(() -> ApiException.notFound("Questionnaire was not found."));
        if (!author.getId().getWorkspaceId().equals(callerWorkspace)) {
            throw ApiException.notFound("Questionnaire was not found.");
        }
        return questionnaire;
    }

    @Transactional(readOnly = true)
    public List<Questionnaire> list(UUID founderId) {
        var workspaceId = currentFounder.requireMembership().getId().getWorkspaceId();
        if (founderId != null && members.findById(new WorkspaceMemberId(workspaceId, founderId)).isEmpty()) {
            throw ApiException.notFound("Founder was not found.");
        }
        if (founderId != null) {
            return questionnaires.findByFounderIdOrderByCreatedAtDesc(founderId);
        }
        return questionnaires.findForWorkspace(workspaceId);
    }

    private List<FieldErrorDetail> missingAnswers(String definition, Map<String, String> answers) {
        List<FieldErrorDetail> errors = new ArrayList<>();
        JsonNode questions = objectMapper.readTree(definition).path("questions");
        if (!questions.isArray()) {
            return errors;
        }
        for (JsonNode question : questions) {
            if (!question.path("required").asBoolean(false)) {
                continue;
            }
            String id = question.path("id").asString();
            String value = answers == null ? null : answers.get(id);
            if (value == null || value.isBlank()) {
                errors.add(new FieldErrorDetail("answers." + id, "required"));
            }
        }
        return errors;
    }
}
