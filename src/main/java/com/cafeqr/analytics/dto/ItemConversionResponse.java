package com.cafeqr.analytics.dto;

import java.math.BigDecimal;

/** One menu item's view→order conversion. {@code conversionRate} = orders ÷ views (0–1). */
public record ItemConversionResponse(
        Long menuItemId,
        String nameEn,
        String nameAr,
        long views,
        long orders,
        BigDecimal conversionRate
) {
}