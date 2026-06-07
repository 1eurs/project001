package com.cafeqr.common.config;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Fail-fast guard: the JWT secret shipped in {@code application.yml} is a public, committed default.
 * Anyone with the repo could forge tokens with it, so the app refuses to start with that value
 * unless the {@code dev} profile is active. Set a real {@code APP_JWT_SECRET} in every other env.
 */
@Component
public class SecretValidation {

    /** The committed default in application.yml — must never be used in a real deployment. */
    private static final String DEFAULT_JWT_SECRET =
            "Y2FmZXFyLXN1cGVyLXNlY3JldC1rZXktY2hhbmdlLW1lLWluLXByb2R1Y3Rpb24tMTIzNDU2";

    public SecretValidation(AppProperties properties, Environment environment) {
        boolean dev = Arrays.stream(environment.getActiveProfiles()).anyMatch("dev"::equalsIgnoreCase);
        String secret = properties.jwt() != null ? properties.jwt().secret() : null;
        if (!dev && DEFAULT_JWT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "Refusing to start: APP_JWT_SECRET is still the committed default value, which is public. "
                            + "Set a unique secret (e.g. `openssl rand -base64 48`) before running outside the dev profile.");
        }
    }
}
