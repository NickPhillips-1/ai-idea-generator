package com.founderslab.founder;

import com.founderslab.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw ApiException.forbidden("This account is not a workspace member.");
        }
        String name = authentication.getName();
        Founder founder = founders.findByUsername(name)
                .or(() -> founders.findByEmailIgnoreCase(name))
                .orElseThrow(() -> ApiException.forbidden("This account is not a workspace member."));
        if (members.findFirstByIdFounderId(founder.getId()).isEmpty()) {
            throw ApiException.forbidden("This account is not a workspace member.");
        }
        return founder;
    }
}
