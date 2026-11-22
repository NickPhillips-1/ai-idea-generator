package com.founderslab.founder;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LocalAccountSeed implements ApplicationRunner {

    static final String USERNAME = "nick";
    static final String PASSWORD = "password";

    private final FounderRepository founders;
    private final WorkspaceMemberRepository members;
    private final PasswordEncoder passwordEncoder;

    public LocalAccountSeed(
            FounderRepository founders,
            WorkspaceMemberRepository members,
            PasswordEncoder passwordEncoder
    ) {
        this.founders = founders;
        this.members = members;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Founder founder = founders.findByUsername(USERNAME)
                .orElseGet(() -> new Founder(USERNAME, "nick@localhost"));
        founder.setUsername(USERNAME);
        founder.setPasswordHash(passwordEncoder.encode(PASSWORD));
        Founder saved = founders.save(founder);
        if (members.findFirstByIdFounderId(saved.getId()).isEmpty()) {
            members.save(new WorkspaceMember(new WorkspaceMemberId(FounderEnrollment.WORKSPACE_ID, saved.getId())));
        }
    }
}
