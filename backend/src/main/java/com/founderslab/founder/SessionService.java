package com.founderslab.founder;

import com.founderslab.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;

@Service
public class SessionService {

    private final FounderEnrollment enrollment;
    private final WorkspaceMemberRepository members;

    public SessionService(FounderEnrollment enrollment, WorkspaceMemberRepository members) {
        this.enrollment = enrollment;
        this.members = members;
    }

    @Transactional(readOnly = true)
    public SessionResponse current(Authentication authentication) {
        Founder founder = enrollment.ensure(authentication);
        WorkspaceMember member = members.findFirstByIdFounderId(founder.getId())
                .orElseThrow(() -> ApiException.forbidden("This account is not a workspace member."));
        return new SessionResponse(
                founder.getId(),
                founder.getEmail(),
                founder.getName(),
                member.getId().getWorkspaceId(),
                member.getRole(),
                pictureUrl(authentication)
        );
    }

    private static String pictureUrl(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        String picture = null;
        if (principal instanceof OidcUser oidcUser) {
            picture = oidcUser.getPicture();
        }
        if ((picture == null || picture.isBlank()) && principal instanceof OAuth2User user) {
            Object value = user.getAttribute("picture");
            if (value != null) {
                picture = value.toString();
            }
        }
        if (picture == null || picture.isBlank()) {
            return null;
        }
        String candidate = picture.trim();
        try {
            URI uri = URI.create(candidate);
            if ("https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null) {
                return candidate;
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }
}
