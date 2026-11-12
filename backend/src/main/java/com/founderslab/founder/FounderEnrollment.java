package com.founderslab.founder;

import com.founderslab.common.exception.ApiException;
import com.founderslab.security.AllowlistFilter;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class FounderEnrollment {

    static final UUID WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final FounderRepository founders;
    private final WorkspaceMemberRepository members;

    public FounderEnrollment(FounderRepository founders, WorkspaceMemberRepository members) {
        this.founders = founders;
        this.members = members;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Founder ensure(Authentication authentication) {
        String email = AllowlistFilter.emailOf(authentication);
        if (email == null || email.isBlank()) {
            throw ApiException.forbidden("This account is not a workspace member.");
        }
        String normalized = email.toLowerCase(Locale.ROOT);
        Founder founder = founders.findByEmailIgnoreCase(normalized)
                .orElseGet(() -> founders.save(new Founder(displayName(authentication, normalized), normalized)));
        if (members.findFirstByIdFounderId(founder.getId()).isEmpty()) {
            members.save(new WorkspaceMember(new WorkspaceMemberId(WORKSPACE_ID, founder.getId())));
        }
        return founder;
    }

    private static String displayName(Authentication authentication, String email) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof OidcUser oidcUser) {
            String fullName = oidcUser.getFullName();
            if (fullName != null && !fullName.isBlank()) {
                return fullName;
            }
        }
        if (principal instanceof OAuth2User oauth2User) {
            Object name = oauth2User.getAttribute("name");
            if (name != null && !name.toString().isBlank()) {
                return name.toString();
            }
        }
        return email;
    }
}
