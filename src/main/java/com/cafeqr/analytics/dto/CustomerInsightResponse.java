package com.cafeqr.analytics.dto;

import java.time.Instant;

/** A returning customer: a VIP (high order_count) or at-risk (long since last order). */
public record CustomerInsightResponse(
        Long profileId,
        String name,
        String phone,
        int orderCount,
        Instant lastOrderAt
) {
}