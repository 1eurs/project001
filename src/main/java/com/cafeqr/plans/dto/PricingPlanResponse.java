package com.cafeqr.plans.dto;

import com.cafeqr.plans.domain.PricingPlan;
import com.cafeqr.restaurants.domain.Plan;

import java.math.BigDecimal;
import java.time.Instant;

public record PricingPlanResponse(
        Long id,
        Plan tier,
        String name,
        BigDecimal monthlyPrice,
        BigDecimal setupFee,
        boolean active,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static PricingPlanResponse from(PricingPlan p) {
        return new PricingPlanResponse(
                p.getId(), p.getTier(), p.getName(), p.getMonthlyPrice(), p.getSetupFee(),
                p.isActive(), p.getDisplayOrder(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
