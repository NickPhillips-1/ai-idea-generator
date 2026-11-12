package com.founderslab;

import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import com.founderslab.founder.WorkspaceMember;
import com.founderslab.founder.WorkspaceMemberId;
import com.founderslab.founder.WorkspaceMemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SessionSecurityTest {

    private static final UUID WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("founderslab.auth.email-allowlist", () -> "ada@example.com,new@example.com");
        registry.add("COOKIE_SECURE", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private FounderRepository founders;

    @Autowired
    private WorkspaceMemberRepository members;

    @Test
    void flywayCreatesTheFoundationSchema() {
        Integer tables = jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'research_finding'",
                Integer.class
        );
        org.junit.jupiter.api.Assertions.assertEquals(1, tables);
    }

    @Test
    void sessionWithoutAuthenticationIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/session"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/v1/session"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void emailOutsideTheAllowlistIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/session").with(oauth2Login().attributes(attrs -> {
            attrs.put("email", "stranger@example.com");
            attrs.put("sub", "stranger");
        })))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void allowlistedGoogleUserIsEnrolledOnFirstSession() throws Exception {
        mockMvc.perform(get("/api/v1/session").with(oauth2Login().attributes(attrs -> {
            attrs.put("email", "new@example.com");
            attrs.put("name", "New Founder");
            attrs.put("picture", "https://example.com/new.png");
            attrs.put("sub", "new");
        })))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new@example.com"))
                .andExpect(jsonPath("$.name").value("New Founder"))
                .andExpect(jsonPath("$.pictureUrl").value("https://example.com/new.png"))
                .andExpect(jsonPath("$.role").value("FOUNDER"))
                .andExpect(jsonPath("$.workspaceId").value(WORKSPACE_ID.toString()));
    }

    @Test
    void allowlistedMemberCanReadTheSession() throws Exception {
        Founder founder = founders.save(new Founder("Ada", "ada@example.com"));
        members.save(new WorkspaceMember(new WorkspaceMemberId(WORKSPACE_ID, founder.getId())));

        mockMvc.perform(get("/api/v1/session").with(oauth2Login().attributes(attrs -> {
            attrs.put("email", "ada@example.com");
            attrs.put("sub", "ada");
        })))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andExpect(jsonPath("$.name").value("Ada"))
                .andExpect(jsonPath("$.pictureUrl").doesNotExist())
                .andExpect(jsonPath("$.role").value("FOUNDER"))
                .andExpect(jsonPath("$.workspaceId").value(WORKSPACE_ID.toString()));
    }

    @Test
    void openApiDocumentsTheSessionRoute() throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/session'].get").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Path output = Path.of("target", "openapi.json");
        Files.createDirectories(output.getParent());
        Files.writeString(output, body);
    }
}
