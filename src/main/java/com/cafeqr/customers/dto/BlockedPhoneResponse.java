package com.cafeqr.customers.dto;

import com.cafeqr.customers.domain.BlockedPhone;

import java.time.Instant;

public record BlockedPhoneResponse(
        Long id,
        String phone,
        String reason,
        String blockedBy,
        Instant createdAt
) {

    public static BlockedPhoneResponse from(BlockedPhone b) {
        return new BlockedPhoneResponse(b.getId(), b.getPhone(), b.getReason(), b.getBlockedBy(), b.getCreatedAt());
    }
}
