package com.cafeqr.loyalty.dto;

import com.cafeqr.loyalty.domain.LoyaltyProgram;

import java.math.BigDecimal;

/** The café's current stamp-card configuration (dashboard). */
public record LoyaltyProgramResponse(
        boolean enabled,
        int stampsRequired,
        String rewardLabel,
        Long rewardItemId,
        BigDecimal minOrderAmount
) {
    public static LoyaltyProgramResponse from(LoyaltyProgram p) {
        return new LoyaltyProgramResponse(
                p.isEnabled(), p.getStampsRequired(), p.getRewardLabel(),
                p.getRewardItemId(), p.getMinOrderAmount());
    }
}
