package com.cafeqr.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** Per-restaurant health snapshot for the platform admin console. */
public record RestaurantStatsResponse(
        Long restaurantId,
        long ordersToday,
        long orders30d,
        BigDecimal revenue30d,
        long ordersTotal,
        Instant lastOrderAt,
        long branches,
        long menuItems
) {}
