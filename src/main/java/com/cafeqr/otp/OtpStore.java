package com.cafeqr.otp;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP store keyed by normalized phone number.
 * TTL is 5 minutes; max 5 failed attempts before the entry is invalidated.
 */
@Component
public class OtpStore {

    static final int TTL_SECONDS = 300;
    private static final int MAX_ATTEMPTS = 5;

    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();

    record Entry(String code, Instant expiresAt, int attempts) {
        boolean expired() { return Instant.now().isAfter(expiresAt); }
        boolean tooManyAttempts() { return attempts >= MAX_ATTEMPTS; }
        Entry withAttempt() { return new Entry(code, expiresAt, attempts + 1); }
    }

    void put(String phone, String code) {
        store.put(phone, new Entry(code, Instant.now().plusSeconds(TTL_SECONDS), 0));
    }

    String peek(String phone) {
        Entry entry = store.get(phone);
        if (entry == null || entry.expired()) {
            return null;
        }
        return entry.code();
    }

    boolean verify(String phone, String code) {
        Entry entry = store.get(phone);
        if (entry == null || entry.expired() || entry.tooManyAttempts()) {
            store.remove(phone);
            return false;
        }
        if (!entry.code().equals(code)) {
            store.put(phone, entry.withAttempt());
            return false;
        }
        store.remove(phone);
        return true;
    }

    @Scheduled(fixedDelay = 60_000)
    void evictExpired() {
        store.entrySet().removeIf(e -> e.getValue().expired());
    }
}
