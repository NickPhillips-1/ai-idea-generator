package com.founderslab.research;

import com.founderslab.common.exception.ApiException;
import com.founderslab.integration.ai.AIProvider;
import com.founderslab.integration.ai.FindingDraft;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
        return new AIProvider() {
            @Override
            public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
                if (draft == null) {
                    throw new AssertionError("The model was called.");
                }
                return responseType.cast(draft);
            }
        };
    }
}
