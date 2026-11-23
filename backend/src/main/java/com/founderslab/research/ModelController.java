package com.founderslab.research;

import com.founderslab.common.ModelName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ModelController {

    private final String model;

    public ModelController(@Value("${AI_MODEL:}") String configured) {
        this.model = ModelName.resolve(configured);
    }

    @GetMapping("/api/v1/model")
    public ModelResponse current() {
        return new ModelResponse(model);
    }

    public record ModelResponse(String model) {
    }
}
