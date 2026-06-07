package com.cafeqr.onboarding.event;

import java.math.BigDecimal;

/** Published after a café self-signs-up (post-commit). Drives the instructions email + admin alert. */
public record CafeSignedUpEvent(
        String ownerEmail,
        String ownerName,
        String cafeName,
        String reference,
        BigDecimal amount,
        String currency
) {}
