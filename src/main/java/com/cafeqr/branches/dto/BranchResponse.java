package com.cafeqr.branches.dto;

import com.cafeqr.branches.domain.Branch;

import java.time.Instant;

public record BranchResponse(
        Long id,
        Long restaurantId,
        String name,
        String address,
        String phone,
        String openingHours,
        boolean active,
        boolean acceptingOrders,
        boolean printerEnabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static BranchResponse from(Branch b) {
        return new BranchResponse(
                b.getId(), b.getRestaurantId(), b.getName(), b.getAddress(), b.getPhone(),
                b.getOpeningHours(), b.isActive(), b.isAcceptingOrders(), b.isPrinterEnabled(),
                b.getCreatedAt(), b.getUpdatedAt());
    }
}
