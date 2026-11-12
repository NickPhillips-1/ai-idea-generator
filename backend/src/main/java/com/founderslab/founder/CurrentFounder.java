package com.founderslab.founder;

import com.founderslab.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentFounder {

    private final FounderEnrollment enrollment;
    private final WorkspaceMemberRepository members;

    public CurrentFounder(FounderEnrollment enrollment, WorkspaceMemberRepository members) {
        this.enrollment = enrollment;
        this.members = members;
    }

    @Transactional(readOnly = true)
    public Founder requireFounder() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return enrollment.ensure(authentication);
    }

    @Transactional(readOnly = true)
    public WorkspaceMember requireMembership() {
        Founder founder = requireFounder();
        return members.findFirstByIdFounderId(founder.getId())
                .orElseThrow(() -> ApiException.forbidden("This account is not a workspace member."));
    }
}
