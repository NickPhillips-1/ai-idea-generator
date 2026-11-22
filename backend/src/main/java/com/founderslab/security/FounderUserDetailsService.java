package com.founderslab.security;

import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class FounderUserDetailsService implements UserDetailsService {

    private final FounderRepository founders;

    public FounderUserDetailsService(FounderRepository founders) {
        this.founders = founders;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Founder founder = founders.findByUsername(username)
                .filter(found -> found.getPasswordHash() != null && !found.getPasswordHash().isBlank())
                .orElseThrow(() -> new UsernameNotFoundException("Unknown username."));
        return User.builder()
                .username(founder.getUsername())
                .password(founder.getPasswordHash())
                .roles("USER")
                .build();
    }
}
