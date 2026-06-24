package com.cafeqr.loyalty.dto;

import com.cafeqr.loyalty.domain.LoyaltyMember;

import java.time.Instant;

/** A café's loyalty member row for the dashboard members list. */
public record LoyaltyMemberResponse(
        String phone,
        String name,
        int stamps,
        int availableRewards,
        int lifetimeStamps,
        int rewardsRedeemed,
        Instant updatedAt
) {
    public static LoyaltyMemberResponse from(LoyaltyMember m) {
        return new LoyaltyMemberResponse(
                m.getPhone(), m.getName(), m.getStamps(), m.getAvailableRewards(),
                m.getLifetimeStamps(), m.getRewardsRedeemed(), m.getUpdatedAt());
    }
}
