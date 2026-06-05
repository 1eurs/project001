package com.cafeqr.menus.dto;

import com.cafeqr.menus.domain.MenuCategory;

import java.time.Instant;

public record CategoryResponse(
        Long id,
        Long restaurantId,
        Long branchId,
        String nameEn,
        String nameAr,
        String descriptionEn,
        String descriptionAr,
        int displayOrder,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static CategoryResponse from(MenuCategory c) {
        return new CategoryResponse(
                c.getId(), c.getRestaurantId(), c.getBranchId(), c.getNameEn(), c.getNameAr(),
                c.getDescriptionEn(), c.getDescriptionAr(), c.getDisplayOrder(), c.isActive(),
                c.getCreatedAt(), c.getUpdatedAt());
    }
}
