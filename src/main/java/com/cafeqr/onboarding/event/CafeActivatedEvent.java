package com.cafeqr.onboarding.event;

/** Published after an admin confirms a café's payment (post-commit). Drives the "you're live" email. */
public record CafeActivatedEvent(
        String ownerEmail,
        String ownerName,
        String cafeName,
        String slug
) {}
