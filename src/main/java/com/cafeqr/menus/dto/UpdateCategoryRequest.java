package com.cafeqr.menus.dto;

import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @Size(max = 150) String nameEn,
        @Size(max = 150) String nameAr,
        @Size(max = 500) String descriptionEn,
        @Size(max = 500) String descriptionAr,
        Integer displayOrder,
        Boolean active
) {}
