package com.cafeqr.onboarding.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** A café awaiting payment confirmation, shown in the platform admin's onboarding queue. */
public record PendingOnboardingResponse(
        Long restaurantId,
        String cafeName,
        String slug,
        String ownerName,
        String ownerEmail,
        String phone,
        BigDecimal amount,
        String reference,
        Instant createdAt
) {}
