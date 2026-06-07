package com.cafeqr.onboarding.event;

import java.time.LocalDate;

/** Published after an admin confirms a renewal payment (post-commit). Drives the "renewed" email. */
public record CafeRenewedEvent(
        String ownerEmail,
        String ownerName,
        String cafeName,
        LocalDate activeUntil
) {}
