package com.cafeqr.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Type-safe binding of the {@code app.*} configuration tree. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Storage storage,
        String publicBaseUrl,
        Cors cors,
        Bootstrap bootstrap
) {

    public record Jwt(
            String secret,
            long accessTokenTtlMinutes,
            long refreshTokenTtlDays,
            String issuer
    ) {}

    public record Storage(
            String type,
            String localDir
    ) {}

    public record Cors(
            List<String> allowedOrigins
    ) {}

    public record Bootstrap(
            boolean enabled,
            String adminEmail,
            String adminPassword,
            String adminFullName
    ) {}
}
