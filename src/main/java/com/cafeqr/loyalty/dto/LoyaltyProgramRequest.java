package com.cafeqr.loyalty.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Café-set stamp-card configuration (dashboard, PUT). */
public record LoyaltyProgramRequest(
        boolean enabled,
        @Min(1) @Max(50) int stampsRequired,
        @NotBlank @Size(max = 120) String rewardLabel,
        /** Menu item granted free on redemption; nullable until the café picks one. */
        Long rewardItemId,
        @DecimalMin("0.0") BigDecimal minOrderAmount
) {}
