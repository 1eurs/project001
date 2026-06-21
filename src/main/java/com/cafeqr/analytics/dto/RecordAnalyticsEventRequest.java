package com.cafeqr.analytics.dto;

import com.cafeqr.analytics.domain.AnalyticsEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Customer-side funnel event from the public menu. {@code restaurantSlug}
 * identifies the tenant (the frontend doesn't know internal ids); optional
 * {@code qrTableToken} resolves to the table that launched the session.
 */
public record RecordAnalyticsEventRequest(
        @NotBlank String restaurantSlug,
        Long branchId,
        String deviceToken,
        String sessionToken,
        String qrTableToken,
        @NotNull AnalyticsEventType eventType,
        Long menuItemId,
        Integer quantity,
        String payload
) {
}