package com.founderslab.security;

import java.time.Duration;
import java.util.function.LongSupplier;

public class GlobalRateLimiter {

    private final int limit;
    private final long windowNanos;
    private final LongSupplier clock;
    private boolean windowOpen;
    private long windowStart;
    private int count;

    public GlobalRateLimiter(int limit, Duration window, LongSupplier clock) {
        if (limit < 1) {
            throw new IllegalArgumentException("founderslab.rate-limit.requests-per-minute must be at least 1");
        }
        if (window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("rate limit window must be positive");
        }
        this.limit = limit;
        this.windowNanos = window.toNanos();
        this.clock = clock;
    }

    public synchronized Decision acquire() {
        long now = clock.getAsLong();
        if (!windowOpen || now - windowStart >= windowNanos) {
            windowOpen = true;
            windowStart = now;
            count = 0;
        }
        if (count >= limit) {
            long remaining = windowNanos - (now - windowStart);
            long seconds = Math.max(1, (remaining + 1_000_000_000L - 1) / 1_000_000_000L);
            return new Decision(false, seconds);
        }
        count++;
        return new Decision(true, 0);
    }

    public record Decision(boolean allowed, long retryAfterSeconds) {
    }
}
