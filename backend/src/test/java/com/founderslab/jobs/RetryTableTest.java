package com.founderslab.jobs;

import com.founderslab.alignment.FounderAlignment;
import com.founderslab.alignment.FounderAlignmentRepository;
import com.founderslab.direction.ResearchDirection;
import com.founderslab.direction.ResearchDirectionRepository;
import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import com.founderslab.research.ResearchJob;
import com.founderslab.research.ResearchJobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest(properties = "founderslab.research.scheduler=false")
@Testcontainers
class RetryTableTest {

    private static final UUID WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID SOURCE_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("COOKIE_SECURE", () -> "false");
    }

    @Autowired
    private FounderRepository founders;

    @Autowired
    private FounderAlignmentRepository alignments;

    @Autowired
    private ResearchDirectionRepository directions;

    @Autowired
    private ResearchJobRepository jobs;

    @Autowired
    private ResearchWorker worker;

    @Test
    void failureBranchMatchesRetryTable() {
        Founder ada = founders.save(new Founder("Ada", "ada-retry@example.com"));
        FounderAlignment alignment = alignments.save(new FounderAlignment(
                WORKSPACE_ID,
                "[\"shared interests are an interpretation until founders confirm them\"]",
                "[\"complementary skills are an interpretation until founders confirm them\"]",
                "an interpretation"
        ));
        ResearchDirection direction = directions.save(new ResearchDirection(
                WORKSPACE_ID,
                alignment.getId(),
                "Shop fixtures",
                "Physical fixtures for small retailers",
                "FOUNDER",
                ada.getId()
        ));
        ResearchJob job = jobs.saveAndFlush(new ResearchJob(
                direction.getId(),
                SOURCE_ID,
                "{\"year\":\"2022\",\"naics\":\"31-33\",\"state\":\"06\"}",
                "retry-table"
        ));

        failOnce(job.getId(), 1, "PENDING");
        failOnce(job.getId(), 2, "PENDING");
        failOnce(job.getId(), 3, "FAILED");
        assertNull(worker.claim());

        jobs.saveAndFlush(terminal(direction.getId(), "SUCCEEDED", "retry-succeeded"));
        jobs.saveAndFlush(terminal(direction.getId(), "CANCELLED", "retry-cancelled"));
        assertNull(worker.claim());
    }

    private void failOnce(UUID jobId, int attempt, String expected) {
        UUID claimed = worker.claim();
        assertEquals(jobId, claimed);
        worker.execute(claimed);
        ResearchJob job = jobs.findById(jobId).orElseThrow();
        assertEquals(attempt, job.getAttemptCount());
        assertEquals(expected, job.getStatus());
    }

    private ResearchJob terminal(UUID directionId, String status, String key) {
        ResearchJob job = new ResearchJob(
                directionId,
                SOURCE_ID,
                "{\"year\":\"2022\",\"naics\":\"31-33\",\"state\":\"06\"}",
                key
        );
        job.setStatus(status);
        return job;
    }
}
