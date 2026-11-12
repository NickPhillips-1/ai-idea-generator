package com.founderslab.founder;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SessionController {

    private final SessionService sessions;

    public SessionController(SessionService sessions) {
        this.sessions = sessions;
    }

    @GetMapping("/api/v1/session")
    public SessionResponse session(Authentication authentication) {
        return sessions.current(authentication);
    }
}
