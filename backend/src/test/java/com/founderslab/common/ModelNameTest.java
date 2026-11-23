package com.founderslab.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ModelNameTest {

    @Test
    void blankConfigurationUsesTheDefaultModel() {
        assertEquals("gpt-5-mini", ModelName.resolve(null));
        assertEquals("gpt-5-mini", ModelName.resolve("  "));
    }

    @Test
    void aConfiguredModelIsKept() {
        assertEquals("gpt-5.4", ModelName.resolve("gpt-5.4"));
    }
}
