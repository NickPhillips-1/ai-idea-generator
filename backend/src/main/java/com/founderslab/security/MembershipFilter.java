package com.founderslab.security;

import com.founderslab.founder.Founder;
import com.founderslab.founder.FounderRepository;
import com.founderslab.founder.WorkspaceMemberRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class MembershipFilter extends OncePerRequestFilter {

    private final FounderRepository founders;
    private final WorkspaceMemberRepository members;

    public MembershipFilter(FounderRepository founders, WorkspaceMemberRepository members) {
        this.founders = founders;
        this.members = members;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/api/")) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null
                    && authentication.isAuthenticated()
                    && !(authentication instanceof AnonymousAuthenticationToken)) {
                String name = authentication.getName();
                Founder founder = founders.findByUsername(name)
                        .or(() -> founders.findByEmailIgnoreCase(name))
                        .orElse(null);
                if (founder == null || members.findFirstByIdFounderId(founder.getId()).isEmpty()) {
                    throw new AccessDeniedException("This account is not a workspace member.");
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
