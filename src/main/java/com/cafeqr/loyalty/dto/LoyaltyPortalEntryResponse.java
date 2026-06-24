package com.cafeqr.loyalty.dto;

import java.time.Instant;

/** One café's stamp card in the customer's cross-café portal. */
public record LoyaltyPortalEntryResponse(
        String restaurantSlug,
        String restaurantName,
        String logoUrl,
        int stampsRequired,
        String rewardLabel,
        int stamps,
        int availableRewards,
        Instant updatedAt
) {}
