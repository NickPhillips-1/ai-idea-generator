package com.founderslab.security;

import com.founderslab.common.exception.ApiException;
import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import com.founderslab.founder.WorkspaceMember;
import com.founderslab.founder.WorkspaceMemberId;
import com.founderslab.founder.WorkspaceMemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.UUID;

@RestController
@ConditionalOnProperty(name = "founderslab.e2e.login-enabled", havingValue = "true")
public class E2eLoginController {

    private static final UUID WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final AuthProperties authProperties;
    private final FounderRepository founders;
    private final WorkspaceMemberRepository members;
    private final SecurityContextRepository securityContextRepository;

    public E2eLoginController(
            AuthProperties authProperties,
            FounderRepository founders,
            WorkspaceMemberRepository members,
            SecurityContextRepository securityContextRepository
    ) {
        this.authProperties = authProperties;
        this.founders = founders;
        this.members = members;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/e2e/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void login(
            @RequestParam String email,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String normalized = email.toLowerCase(Locale.ROOT);
        if (!authProperties.allowedEmails().contains(normalized)) {
            throw ApiException.forbidden("Email is not on the founder allowlist.");
        }
        Founder founder = founders.findByEmailIgnoreCase(normalized)
                .orElseGet(() -> founders.save(new Founder(normalized, normalized)));
        if (members.findFirstByIdFounderId(founder.getId()).isEmpty()) {
            members.save(new WorkspaceMember(new WorkspaceMemberId(WORKSPACE_ID, founder.getId())));
        }
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                normalized,
                "n/a",
                AuthorityUtils.createAuthorityList("ROLE_USER")
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
