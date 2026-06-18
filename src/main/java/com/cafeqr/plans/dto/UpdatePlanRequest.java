package com.cafeqr.plans.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Patch a tier's pricing. Every field is optional — a null leaves that field
 * unchanged. To set the monthly price to "custom" (NULL), send
 * {@code clearMonthlyPrice = true} (a plain null monthlyPrice means "no change").
 */
public record UpdatePlanRequest(
        @Size(max = 80) String name,
        @DecimalMin("0.0") BigDecimal monthlyPrice,
        boolean clearMonthlyPrice,
        @DecimalMin("0.0") BigDecimal setupFee,
        Boolean active,
        Integer displayOrder
) {}
