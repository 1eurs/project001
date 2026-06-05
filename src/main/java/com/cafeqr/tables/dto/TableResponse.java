package com.cafeqr.tables.dto;

import com.cafeqr.tables.domain.RestaurantTable;

import java.time.Instant;

public record TableResponse(
        Long id,
        Long restaurantId,
        Long branchId,
        String tableNumber,
        String qrCodeToken,
        String qrCodeUrl,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static TableResponse from(RestaurantTable t) {
        return new TableResponse(
                t.getId(), t.getRestaurantId(), t.getBranchId(), t.getTableNumber(),
                t.getQrCodeToken(), t.getQrCodeUrl(), t.isActive(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
