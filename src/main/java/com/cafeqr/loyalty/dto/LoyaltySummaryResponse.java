package com.cafeqr.loyalty.dto;

import com.cafeqr.loyalty.domain.LoyaltyMember;
import com.cafeqr.loyalty.domain.LoyaltyProgram;

/**
 * One café's stamp progress for a phone, used by the menu and checkout. {@code enabled} is
 * false when the café has no active program, so the customer UI can hide loyalty entirely.
 */
public record LoyaltySummaryResponse(
        boolean enabled,
        int stampsRequired,
        String rewardLabel,
        Long rewardItemId,
        int stamps,
        int availableRewards
) {
    /** Program is present and enabled; member may be null (customer has no stamps yet). */
    public static LoyaltySummaryResponse of(LoyaltyProgram program, LoyaltyMember member) {
        return new LoyaltySummaryResponse(
                true, program.getStampsRequired(), program.getRewardLabel(), program.getRewardItemId(),
                member == null ? 0 : member.getStamps(),
                member == null ? 0 : member.getAvailableRewards());
    }

    public static LoyaltySummaryResponse disabled() {
        return new LoyaltySummaryResponse(false, 0, null, null, 0, 0);
    }
}
