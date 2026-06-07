package com.cafeqr.common.ratelimit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tiny in-memory fixed-window rate limiter (per key). Fine for the single-instance deployment;
 * swap for Redis/bucket4j if the backend is ever horizontally scaled.
 */
@Component
public class RateLimiter {

    private static final class Window {
        long startSec;
        int count;

        Window(long startSec) {
            this.startSec = startSec;
            this.count = 1;
        }
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** @return true if the request is within the limit; false if it should be rejected. */
    public boolean allow(String key, int limit, int windowSeconds) {
        long now = Instant.now().getEpochSecond();
        Window w = windows.compute(key, (k, cur) -> {
            if (cur == null || now - cur.startSec >= windowSeconds) {
                return new Window(now);
            }
            cur.count++;
            return cur;
        });
        return w.count <= limit;
    }

    /** Evict stale windows so the map can't grow unbounded across many client IPs. */
    @Scheduled(fixedDelay = 300_000L)
    void evictStale() {
        long cutoff = Instant.now().getEpochSecond() - 600;
        windows.entrySet().removeIf(e -> e.getValue().startSec < cutoff);
    }
}
