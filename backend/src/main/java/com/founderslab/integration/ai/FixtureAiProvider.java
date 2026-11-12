package com.founderslab.integration.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@ConditionalOnProperty(name = "founderslab.e2e.fixtures", havingValue = "true")
public class FixtureAiProvider implements AIProvider {

    @Override
    public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
        FindingDraft draft = new FindingDraft();
        draft.setFactualSummary("County Business Patterns lists 100 establishments.");
        draft.setSupportingEvidence("ESTAB 100 for California, NAICS 31-33, 2022.");
        draft.setAiInterpretation("This reading is not proof that a customer has the problem.");
        draft.setUnknowns("The payload does not name a buyer or a willingness to pay.");
        return responseType.cast(draft);
    }
}
