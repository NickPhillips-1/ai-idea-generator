package com.founderslab.jobs;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ResearchScheduler {

    private final ResearchWorker worker;

    public ResearchScheduler(ResearchWorker worker) {
        this.worker = worker;
    }

    @Scheduled(fixedDelayString = "${founderslab.research.poll-delay-ms:2000}")
    public void poll() {
        UUID jobId = worker.claim();
        if (jobId != null) {
            worker.execute(jobId);
        }
    }
}
