package com.cafeqr.loyalty.dto;

import com.cafeqr.loyalty.domain.LoyaltyMember;
import com.cafeqr.loyalty.domain.LoyaltyProgram;

import java.math.BigDecimal;
import java.util.List;

/**
 * One café's stamp progress for a phone, used by the menu and checkout. {@code enabled} is
 * false when the café has no active program, so the customer UI can hide loyalty entirely.
 */
public record LoyaltySummaryResponse(
        boolean enabled,
        int stampsRequired,
        String rewardLabel,
        /** Menu items eligible as the free reward — the customer picks one at checkout. */
        List<Long> rewardItemIds,
        int stamps,
        int availableRewards,
        /** Optional floor a customer's order must reach to earn a stamp (null = no floor). */
        BigDecimal minOrderAmount,
        /** Card style (loyalty card studio): accent/background hex, stamp emoji, watermark motif key. */
        String cardColor,
        String cardBg,
        String stampIcon,
        String cardMotif
) {
    /** Program is present and enabled; member may be null (customer has no stamps yet). */
    public static LoyaltySummaryResponse of(LoyaltyProgram program, LoyaltyMember member) {
        return new LoyaltySummaryResponse(
                true, program.getStampsRequired(), program.getRewardLabel(),
                List.copyOf(program.getRewardItemIds()),
                member == null ? 0 : member.getStamps(),
                member == null ? 0 : member.getAvailableRewards(),
                program.getMinOrderAmount(),
                program.getCardColor(), program.getCardBg(), program.getStampIcon(), program.getCardMotif());
    }

    public static LoyaltySummaryResponse disabled() {
        return new LoyaltySummaryResponse(false, 0, null, List.of(), 0, 0, null, null, null, null, null);
    }
}
