package com.founderslab.alignment;

import com.founderslab.common.exception.ApiException;
import com.founderslab.common.response.FieldErrorDetail;
import com.founderslab.founder.CurrentFounder;
import com.founderslab.founder.WorkspaceMember;
import com.founderslab.founder.WorkspaceMemberRepository;
import com.founderslab.integration.ai.AIProvider;
import com.founderslab.integration.ai.FindingDraft;
import com.founderslab.questionnaire.Questionnaire;
import com.founderslab.questionnaire.QuestionnaireRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AlignmentService {

    private final QuestionnaireRepository questionnaires;
    private final FounderAlignmentRepository alignments;
    private final CurrentFounder currentFounder;
    private final WorkspaceMemberRepository members;
    private final AIProvider aiProvider;
    private final JdbcTemplate jdbc;

    public AlignmentService(
            QuestionnaireRepository questionnaires,
            FounderAlignmentRepository alignments,
            CurrentFounder currentFounder,
            WorkspaceMemberRepository members,
            AIProvider aiProvider,
            JdbcTemplate jdbc
    ) {
        this.questionnaires = questionnaires;
        this.alignments = alignments;
        this.currentFounder = currentFounder;
        this.members = members;
        this.aiProvider = aiProvider;
        this.jdbc = jdbc;
    }

    @Transactional
    public GeneratedAlignment generate(List<UUID> questionnaireIds) {
        UUID workspaceId = currentFounder.requireMembership().getId().getWorkspaceId();
        Set<UUID> founders = new LinkedHashSet<>();
        List<Questionnaire> rows = questionnaireIds.stream().map(id -> questionnaires.findById(id)
                .orElseThrow(() -> ApiException.notFound("Questionnaire was not found."))).toList();
        for (Questionnaire row : rows) {
            if (!"SUBMITTED".equals(row.getStatus())) {
                throw ApiException.unprocessable(
                        "Alignment can only use submitted questionnaires.",
                        List.of(new FieldErrorDetail("questionnaireIds", "submitted"))
                );
            }
            WorkspaceMember author = members.findFirstByIdFounderId(row.getFounderId())
                    .orElseThrow(() -> ApiException.notFound("Questionnaire was not found."));
            if (!author.getId().getWorkspaceId().equals(workspaceId)) {
                throw ApiException.notFound("Questionnaire was not found.");
            }
            founders.add(row.getFounderId());
        }
        if (founders.size() < 2) {
            throw ApiException.unprocessable(
                    "At least two distinct founders are required.",
                    List.of(new FieldErrorDetail("questionnaireIds", "At least two distinct founders are required."))
            );
        }
        FindingDraft draft = aiProvider.generateStructuredResponse(
                "Compare these submitted questionnaires and explain the overlap. " + rows,
                FindingDraft.class
        );
        FounderAlignment alignment = alignments.saveAndFlush(new FounderAlignment(
                workspaceId,
                "[\"shared interests are an interpretation until founders confirm them\"]",
                "[\"complementary skills are an interpretation until founders confirm them\"]",
                draft.getAiInterpretation()
        ));
        for (UUID founderId : founders) {
            jdbc.update(
                    "insert into alignment_founder (alignment_id, founder_id) values (?, ?)",
                    alignment.getId(),
                    founderId
            );
        }
        for (Questionnaire row : rows) {
            jdbc.update(
                    "insert into alignment_questionnaire (alignment_id, questionnaire_id) values (?, ?)",
                    alignment.getId(),
                    row.getId()
            );
        }
        return new GeneratedAlignment(alignment, List.copyOf(founders), rows.stream().map(Questionnaire::getId).toList());
    }

    public record GeneratedAlignment(FounderAlignment alignment, List<UUID> founderIds, List<UUID> questionnaireIds) {
    }
}
