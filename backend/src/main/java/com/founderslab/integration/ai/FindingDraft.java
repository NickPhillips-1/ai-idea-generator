package com.founderslab.integration.ai;

import jakarta.validation.constraints.NotBlank;

public class FindingDraft {

    @NotBlank
    private String factualSummary;

    @NotBlank
    private String supportingEvidence;

    @NotBlank
    private String aiInterpretation;

    @NotBlank
    private String unknowns;

    public String getFactualSummary() {
        return factualSummary;
    }

    public void setFactualSummary(String factualSummary) {
        this.factualSummary = factualSummary;
    }

    public String getSupportingEvidence() {
        return supportingEvidence;
    }

    public void setSupportingEvidence(String supportingEvidence) {
        this.supportingEvidence = supportingEvidence;
    }

    public String getAiInterpretation() {
        return aiInterpretation;
    }

    public void setAiInterpretation(String aiInterpretation) {
        this.aiInterpretation = aiInterpretation;
    }

    public String getUnknowns() {
        return unknowns;
    }

    public void setUnknowns(String unknowns) {
        this.unknowns = unknowns;
    }
}
