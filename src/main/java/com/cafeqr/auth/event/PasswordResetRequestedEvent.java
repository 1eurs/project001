package com.cafeqr.auth.event;

/** Published when a user requests a password reset (post-commit). Drives the reset-link email. */
public record PasswordResetRequestedEvent(
        String email,
        String name,
        String token
) {}
