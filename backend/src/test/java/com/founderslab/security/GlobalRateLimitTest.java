package com.founderslab.security;

import com.founderslab.common.response.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalRateLimitTest {

    @Test
    void rejectsRequestsAfterTheWindowIsFull() {
        AtomicLong clock = new AtomicLong(0);
        GlobalRateLimiter limiter = new GlobalRateLimiter(2, Duration.ofMinutes(1), clock::get);

        assertTrue(limiter.acquire().allowed());
        assertTrue(limiter.acquire().allowed());
        GlobalRateLimiter.Decision rejected = limiter.acquire();
        assertFalse(rejected.allowed());
        assertEquals(60, rejected.retryAfterSeconds());
    }

    @Test
    void opensANewWindowWhenTheMinuteElapses() {
        AtomicLong clock = new AtomicLong(0);
        GlobalRateLimiter limiter = new GlobalRateLimiter(1, Duration.ofMinutes(1), clock::get);

        assertTrue(limiter.acquire().allowed());
        assertFalse(limiter.acquire().allowed());
        clock.addAndGet(Duration.ofMinutes(1).toNanos());
        assertTrue(limiter.acquire().allowed());
    }

    @Test
    void rejectsANonPositiveLimit() {
        assertThrows(IllegalArgumentException.class,
                () -> new GlobalRateLimiter(0, Duration.ofMinutes(1), () -> 0));
    }

    @Test
    void apiRequestOverTheLimitIs429() throws Exception {
        GlobalRateLimitFilter filter = filter(1);
        FilterChain chain = (request, response) -> ((HttpServletResponse) response).setStatus(200);

        MockHttpServletResponse first = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/session"), first, chain);
        assertEquals(200, first.getStatus());

        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/session"), second, chain);
        assertEquals(429, second.getStatus());
        assertEquals("1", second.getHeader("Retry-After"));
        assertTrue(second.getContentAsString().contains(GlobalRateLimitFilter.MESSAGE));
        assertTrue(second.getContentAsString().contains("\"fieldErrors\":["));
    }

    @Test
    void pathsOutsideTheApiDoNotCount() throws ServletException, IOException {
        GlobalRateLimitFilter filter = filter(1);
        FilterChain chain = (request, response) -> ((HttpServletResponse) response).setStatus(204);

        filter.doFilter(new MockHttpServletRequest("GET", "/api/v1/session"), new MockHttpServletResponse(), chain);

        MockHttpServletResponse login = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/login"), login, chain);
        assertEquals(204, login.getStatus());
    }

    private static GlobalRateLimitFilter filter(int limit) {
        GlobalRateLimiter limiter = new GlobalRateLimiter(limit, Duration.ofSeconds(1), () -> 0);
        return new GlobalRateLimitFilter(limiter, new ApiErrorWriter(JsonMapper.builder().build()));
    }
}
