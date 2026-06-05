package com.cafeqr.subscriptions.dto;

import com.cafeqr.subscriptions.domain.BillingCycle;
import com.cafeqr.subscriptions.domain.SubscriptionStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateSubscriptionRequest(
        @Size(max = 80) String planName,
        BillingCycle billingCycle,
        @DecimalMin("0.0") BigDecimal price,
        SubscriptionStatus status,
        LocalDate startDate,
        LocalDate endDate
) {}
