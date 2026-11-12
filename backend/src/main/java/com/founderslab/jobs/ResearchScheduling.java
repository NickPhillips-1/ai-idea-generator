package com.founderslab.jobs;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "founderslab.research.scheduler", havingValue = "true", matchIfMissing = true)
public class ResearchScheduling {
}
