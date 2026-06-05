package com.cafeqr.subscriptions.dto;

import com.cafeqr.subscriptions.domain.BillingCycle;
import com.cafeqr.subscriptions.domain.Subscription;
import com.cafeqr.subscriptions.domain.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        Long restaurantId,
        String planName,
        BillingCycle billingCycle,
        BigDecimal price,
        SubscriptionStatus status,
        LocalDate startDate,
        LocalDate endDate,
        /** Convenience flag: TRIAL/ACTIVE and not past its end date. */
        boolean currentlyActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static SubscriptionResponse from(Subscription s) {
        return new SubscriptionResponse(
                s.getId(), s.getRestaurantId(), s.getPlanName(), s.getBillingCycle(), s.getPrice(),
                s.getStatus(), s.getStartDate(), s.getEndDate(), isActive(s),
                s.getCreatedAt(), s.getUpdatedAt());
    }

    private static boolean isActive(Subscription s) {
        boolean activeStatus = s.getStatus() == SubscriptionStatus.ACTIVE
                || s.getStatus() == SubscriptionStatus.TRIAL;
        boolean notExpired = s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now());
        return activeStatus && notExpired;
    }
}
