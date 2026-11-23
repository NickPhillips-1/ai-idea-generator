package com.founderslab.common;

public final class ModelName {

    public static final String DEFAULT = "gpt-5-mini";

    private ModelName() {
    }

    public static String resolve(String configured) {
        if (configured == null || configured.isBlank()) {
            return DEFAULT;
        }
        return configured;
    }
}
