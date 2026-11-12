package com.founderslab;

import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import com.founderslab.founder.WorkspaceMember;
import com.founderslab.founder.WorkspaceMemberId;
import com.founderslab.founder.WorkspaceMemberRepository;
import com.founderslab.integration.ai.AIProvider;
import com.founderslab.integration.ai.FindingDraft;
import com.founderslab.integration.sources.ResearchData;
import com.founderslab.integration.sources.ResearchRequest;
import com.founderslab.integration.sources.ResearchSourceAdapter;
import com.founderslab.jobs.ResearchWorker;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "founderslab.research.scheduler=false",
        "founderslab.research.max-jobs-per-hour=1"
})
@AutoConfigureMockMvc
@Testcontainers
@Import(ResearchPathTest.Fixtures.class)
class ResearchPathTest {

    private static final UUID WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID SOURCE_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID TEMPLATE_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("founderslab.auth.email-allowlist", () -> "ada@example.com,grace@example.com");
        registry.add("COOKIE_SECURE", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FounderRepository founders;

    @Autowired
    private WorkspaceMemberRepository members;

    @Autowired
    private ResearchWorker worker;

    @Autowired
    private Fixtures.CountingAdapter adapter;

    @Test
    void questionnaireAlignmentDirectionAndFindingStayCited() throws Exception {
        founders.save(new Founder("Ada", "ada@example.com"));
        Founder grace = founders.save(new Founder("Grace", "grace@example.com"));
        members.save(new WorkspaceMember(new WorkspaceMemberId(WORKSPACE_ID, founders.findByEmailIgnoreCase("ada@example.com").orElseThrow().getId())));
        members.save(new WorkspaceMember(new WorkspaceMemberId(WORKSPACE_ID, grace.getId())));

        String adaQuestionnaire = submit("ada@example.com");
        String graceQuestionnaire = submit("grace@example.com");

        String alignmentId = mockMvc.perform(post("/api/v1/alignments/generate")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"questionnaireIds\":[\"" + adaQuestionnaire + "\",\"" + graceQuestionnaire + "\"]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("READY"))
                .andReturn().getResponse().getContentAsString();
        alignmentId = alignmentId.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        String directionId = mockMvc.perform(post("/api/v1/directions")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"alignmentId\":\"" + alignmentId + "\",\"title\":\"Shop fixtures\",\"description\":\"Physical fixtures for small retailers\",\"origin\":\"FOUNDER\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        directionId = directionId.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/v1/directions/" + directionId + "/research")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .header("Idempotency-Key", "path-1")
                        .contentType("application/json")
                        .content("{\"approvedResearchSourceId\":\"" + SOURCE_ID + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("PENDING"));

        worker.execute(worker.claim());

        String findings = mockMvc.perform(get("/api/v1/directions/" + directionId + "/findings").with(oauth("ada@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].verificationStatus").value("UNREVIEWED"))
                .andExpect(jsonPath("$.items[0].factualSummary").value("County Business Patterns lists 100 establishments."))
                .andExpect(jsonPath("$.items[0].aiInterpretation").value("This reading is not proof that a customer has the problem."))
                .andExpect(jsonPath("$.items[0].unknowns").value(org.hamcrest.Matchers.containsString("cannot support willingness to pay")))
                .andExpect(jsonPath("$.items[0].researchSourceId").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String findingId = com.jayway.jsonpath.JsonPath.read(findings, "$.items[0].id");
        String jobId = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(get("/api/v1/directions/" + directionId + "/findings").with(oauth("ada@example.com")))
                        .andReturn().getResponse().getContentAsString(),
                "$.items[0].id"
        );
        org.junit.jupiter.api.Assertions.assertEquals(findingId, jobId);

        mockMvc.perform(get("/api/v1/research-jobs/" + java.util.UUID.randomUUID()).with(oauth("stranger@example.com")))
                .andExpect(status().isForbidden());

        String opportunityId = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(post("/api/v1/opportunities")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"title\":\"Shop fixtures\",\"customerProblem\":\"Retailers need a sturdier fixture\",\"targetCustomer\":\"Independent hardware stores\",\"findingIds\":[\"" + findingId + "\"]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.businessType").value("PHYSICAL_PRODUCT"))
                .andExpect(jsonPath("$.evaluationSummary").value(""))
                .andReturn().getResponse().getContentAsString(), "$.id");

        mockMvc.perform(post("/api/v1/opportunities/" + opportunityId + "/products")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"description\":\"A steel shelf bracket\",\"targetBuyers\":\"Hardware stores\",\"differentiation\":\"Heavier gauge than the common import\",\"estimatedCosts\":\"Shop time and steel, not a verified unit cost\",\"feasibility\":\"A small shop can cut and weld it. This is a note, not a verified study.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.businessType").value("PHYSICAL_PRODUCT"));

        mockMvc.perform(post("/api/v1/opportunities/" + opportunityId + "/decisions")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"decision\":\"ADVANCE\",\"rationale\":\"The Census count is only market structure. Customer pain is still unknown.\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/opportunities/" + opportunityId + "/decisions")
                        .with(oauth("grace@example.com"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"decision\":\"INVESTIGATE\",\"rationale\":\"We still need a source that describes the buyer.\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/opportunities/" + opportunityId).with(oauth("ada@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
        mockMvc.perform(get("/api/v1/opportunities/" + opportunityId + "/decisions").with(oauth("ada@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].decision").value("ADVANCE"))
                .andExpect(jsonPath("$.items[1].decision").value("INVESTIGATE"));

        mockMvc.perform(post("/api/v1/directions/" + directionId + "/research")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .header("Idempotency-Key", "path-1")
                        .contentType("application/json")
                        .content("{\"approvedResearchSourceId\":\"" + SOURCE_ID + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));

        mockMvc.perform(post("/api/v1/directions/" + directionId + "/research")
                        .with(oauth("ada@example.com"))
                        .with(csrf())
                        .header("Idempotency-Key", "path-2")
                        .contentType("application/json")
                        .content("{\"approvedResearchSourceId\":\"" + SOURCE_ID + "\"}"))
                .andExpect(status().isTooManyRequests());

        org.junit.jupiter.api.Assertions.assertEquals(1, adapter.calls());
    }

    private String submit(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/questionnaires")
                        .with(oauth(email))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"templateId\":\"" + TEMPLATE_ID + "\",\"answers\":{\"interests\":\"retail fixtures\",\"skills\":\"fabrication\",\"resources\":\"a small shop\",\"goals\":\"a physical product we can make\"}}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor oauth(String email) {
        return oauth2Login().attributes(attrs -> {
            attrs.put("email", email);
            attrs.put("sub", email);
        });
    }

    @TestConfiguration
    static class Fixtures {
        @Bean
        @Primary
        CountingAdapter countingAdapter() {
            return new CountingAdapter();
        }

        @Bean
        @Primary
        AIProvider fixtureAi() {
            return new AIProvider() {
                @Override
                public <T> T generateStructuredResponse(String prompt, Class<T> responseType) {
                    FindingDraft draft = new FindingDraft();
                    draft.setFactualSummary("County Business Patterns lists 100 establishments.");
                    draft.setSupportingEvidence("ESTAB 100");
                    draft.setAiInterpretation("This reading is not proof that a customer has the problem.");
                    draft.setUnknowns("County Business Patterns does not show willingness to pay or a customer problem.");
                    return responseType.cast(draft);
                }
            };
        }

        static class CountingAdapter implements ResearchSourceAdapter {
            private final AtomicInteger calls = new AtomicInteger();

            int calls() {
                return calls.get();
            }

            @Override
            public ResearchData collect(ResearchRequest request) {
                calls.incrementAndGet();
                return new ResearchData(
                        "https://api.census.gov/data/2022/cbp?get=NAME,ESTAB&for=state:06&NAICS2017=31-33",
                        "[[\"NAME\",\"ESTAB\"],[\"California\",\"100\"]]",
                        "abc123"
                );
            }
        }
    }
}
