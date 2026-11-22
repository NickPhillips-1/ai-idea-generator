package com.founderslab.founder;

import com.founderslab.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                null
        );
    }
}
