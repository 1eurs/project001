package com.cafeqr.menus.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateMenuItemRequest(
        Long categoryId,
        @Size(max = 150) String nameEn,
        @Size(max = 150) String nameAr,
        @Size(max = 500) String descriptionEn,
        @Size(max = 500) String descriptionAr,
        @DecimalMin(value = "0.0", inclusive = false) @Digits(integer = 9, fraction = 3) BigDecimal price,
        @Size(max = 500) String imageUrl,
        Boolean available,
        @Positive Integer preparationTimeMinutes,
        Integer displayOrder
) {}
