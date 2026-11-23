package com.founderslab.security;

import com.founderslab.common.response.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class GlobalRateLimitFilter extends OncePerRequestFilter {

    static final String MESSAGE = "The request rate for this server has been reached.";

    private final GlobalRateLimiter limiter;
    private final ApiErrorWriter errors;

    public GlobalRateLimitFilter(GlobalRateLimiter limiter, ApiErrorWriter errors) {
        this.limiter = limiter;
        this.errors = errors;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        GlobalRateLimiter.Decision decision = limiter.acquire();
        if (!decision.allowed()) {
            response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
            errors.write(response, errors.create(
                    HttpStatus.TOO_MANY_REQUESTS,
                    MESSAGE,
                    request.getRequestURI(),
                    List.of()
            ));
            return;
        }
        filterChain.doFilter(request, response);
    }
}
