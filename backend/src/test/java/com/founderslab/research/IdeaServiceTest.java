package com.founderslab.research;

import com.founderslab.common.exception.ApiException;
import com.founderslab.integration.ai.AIProvider;
import com.founderslab.integration.ai.FindingDraft;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IdeaServiceTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void returnsTheModelReading() {
        IdeaService ideas = new IdeaService(provider(draft("A test idea.")), validator);

        IdeaService.IdeaReading reading = ideas.research("  Test  ");

        assertEquals("A test idea.", reading.factualSummary());
        assertEquals("The founder wrote Test.", reading.supportingEvidence());
    }

    @Test
    void sendsTheIdeaAndTheThreeQuestionnaires(@TempDir Path dir) throws Exception {
        Files.writeString(dir.resolve("Paul_Questionnaire.md"), "Paul likes fungi.");
        Files.writeString(dir.resolve("Nick_Questionnaire.md"), "Nick likes shops.");
        Files.writeString(dir.resolve("Zach_Questionnaire.md"), "Zach likes meat.");
        String[] captured = new String[1];
        IdeaService ideas = new IdeaService(provider(draft("A test idea."), captured), validator, dir);

        ideas.research("  mushrooms  ");

        String prompt = captured[0];
        assertTrue(prompt.contains("Answer the idea from those questionnaires."));
        assertTrue(prompt.contains("Use the questionnaire of every founder the idea names."));
        assertTrue(prompt.contains("Do not claim a founder's answers are missing when that questionnaire is in this prompt."));
        assertTrue(prompt.contains("""
                <untrusted-idea>
                mushrooms
                </untrusted-idea>
                """));
        assertTrue(prompt.contains("""
                <untrusted-questionnaire founder="Paul">
                Paul likes fungi.
                </untrusted-questionnaire>
                """));
        assertTrue(prompt.contains("""
                <untrusted-questionnaire founder="Nick">
                Nick likes shops.
                </untrusted-questionnaire>
                """));
        assertTrue(prompt.contains("""
                <untrusted-questionnaire founder="Zach">
                Zach likes meat.
                </untrusted-questionnaire>
                """));
        assertFalse(prompt.contains("<prior-turn>"));
    }

    @Test
    void sendsPriorTurnsWithTheNewIdea(@TempDir Path dir) throws Exception {
        Files.writeString(dir.resolve("Paul_Questionnaire.md"), "Paul likes fungi.");
        Files.writeString(dir.resolve("Nick_Questionnaire.md"), "Nick likes shops.");
        Files.writeString(dir.resolve("Zach_Questionnaire.md"), "Zach likes meat.");
        String[] captured = new String[1];
        IdeaService ideas = new IdeaService(provider(draft("A follow-up."), captured), validator, dir);

        ideas.research("testing again", List.of(new IdeaService.PriorTurn(
                "hey test",
                "A test idea.",
                "The founder wrote hey test.",
                "This is not evidence of demand.",
                "No customer interviews."
        )));

        String prompt = captured[0];
        assertTrue(prompt.contains("Earlier turns in this chat are conversation. They are not a new source."));
        assertTrue(prompt.contains("""
                <prior-turn>
                <user>
                hey test
                </user>
                factualSummary: A test idea.
                supportingEvidence: The founder wrote hey test.
                aiInterpretation: This is not evidence of demand.
                unknowns: No customer interviews.
                </prior-turn>
                """));
        assertTrue(prompt.contains("""
                <untrusted-idea>
                testing again
                </untrusted-idea>
                """));
        assertTrue(prompt.contains("Paul likes fungi."));
        assertTrue(prompt.contains("Nick likes shops."));
        assertTrue(prompt.contains("Zach likes meat."));
    }

    @Test
    void rejectsABlankQuestionnaireBeforeCallingTheModel(@TempDir Path dir) throws Exception {
        Files.writeString(dir.resolve("Paul_Questionnaire.md"), "   ");
        Files.writeString(dir.resolve("Nick_Questionnaire.md"), "Nick likes shops.");
        Files.writeString(dir.resolve("Zach_Questionnaire.md"), "Zach likes meat.");
        IdeaService ideas = new IdeaService(provider(null), validator, dir);

        ApiException exception = assertThrows(ApiException.class, () -> ideas.research("Test"));

        assertEquals(422, exception.status().value());
        assertEquals("Paul's questionnaire could not be read.", exception.getMessage());
    }

    @Test
    void rejectsABlankIdeaBeforeCallingTheModel() {
        IdeaService ideas = new IdeaService(provider(null), validator);

        ApiException exception = assertThrows(ApiException.class, () -> ideas.research("  "));

        assertEquals(400, exception.status().value());
    }

    @Test
    void rejectsAnInvalidModelResponse() {
        FindingDraft draft = draft("A test idea.");
        draft.setUnknowns(" ");
        IdeaService ideas = new IdeaService(provider(draft), validator);

        ApiException exception = assertThrows(ApiException.class, () -> ideas.research("Test"));

        assertEquals(422, exception.status().value());
    }

    private static FindingDraft draft(String summary) {
        FindingDraft draft = new FindingDraft();
        draft.setFactualSummary(summary);
        draft.setSupportingEvidence("The founder wrote Test.");
        draft.setAiInterpretation("This is not evidence of demand.");
        draft.setUnknowns("No customer interviews.");
        return draft;
    }

    private static AIProvider provider(FindingDraft draft) {
        return provider(draft, null);
    }

    private static AIProvider provider(FindingDraft draft, String[] captured) {
        return new AIProvider() {
            @Override
            public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
                if (captured != null) {
                    captured[0] = prompt;
                }
                if (draft == null) {
                    throw new AssertionError("The model was called.");
                }
                return responseType.cast(draft);
            }
        };
    }
}
