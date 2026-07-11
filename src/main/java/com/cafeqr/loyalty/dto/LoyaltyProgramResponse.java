package com.cafeqr.loyalty.dto;

import com.cafeqr.loyalty.domain.LoyaltyProgram;

import java.math.BigDecimal;
import java.util.List;

/** The café's current stamp-card configuration (dashboard). */
public record LoyaltyProgramResponse(
        boolean enabled,
        int stampsRequired,
        String rewardLabel,
        List<Long> rewardItemIds,
        BigDecimal minOrderAmount,
        String cardColor,
        String cardBg,
        String stampIcon,
        String cardMotif
) {
    public static LoyaltyProgramResponse from(LoyaltyProgram p) {
        return new LoyaltyProgramResponse(
                p.isEnabled(), p.getStampsRequired(), p.getRewardLabel(),
                List.copyOf(p.getRewardItemIds()), p.getMinOrderAmount(),
                p.getCardColor(), p.getCardBg(), p.getStampIcon(), p.getCardMotif());
    }
}
