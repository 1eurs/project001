package com.cafeqr.analytics.dto;

/** Expected demand for one (weekday, hour) slot, derived from the N-week average. */
public record ForecastSlotResponse(
        int dayOfWeek,
        int hour,
        double expectedOrders
) {
}