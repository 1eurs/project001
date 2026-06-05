package com.cafeqr.menus.dto;

import com.cafeqr.menus.domain.MenuItem;

import java.math.BigDecimal;
import java.time.Instant;

public record MenuItemResponse(
        Long id,
        Long restaurantId,
        Long branchId,
        Long categoryId,
        String nameEn,
        String nameAr,
        String descriptionEn,
        String descriptionAr,
        BigDecimal price,
        String imageUrl,
        boolean available,
        Integer preparationTimeMinutes,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static MenuItemResponse from(MenuItem i) {
        return new MenuItemResponse(
                i.getId(), i.getRestaurantId(), i.getBranchId(), i.getCategoryId(),
                i.getNameEn(), i.getNameAr(), i.getDescriptionEn(), i.getDescriptionAr(),
                i.getPrice(), i.getImageUrl(), i.isAvailable(), i.getPreparationTimeMinutes(),
                i.getDisplayOrder(), i.getCreatedAt(), i.getUpdatedAt());
    }
}
