package com.founderslab.integration.ai;

public interface AIProvider {

    <T> T generateStructuredResponse(String prompt, Class<T> responseType);
}
