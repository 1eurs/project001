package com.cafeqr.analytics.dto;

import java.math.BigDecimal;

public record BestSellingItem(
        Long menuItemId,
        String nameEn,
        String nameAr,
        long totalQuantity,
        BigDecimal totalRevenue
) {}
