package com.cafeqr.restaurants.dto;

import com.cafeqr.restaurants.domain.Restaurant;

import java.math.BigDecimal;
import java.time.Instant;

public record RestaurantResponse(
        Long id,
        String name,
        String slug,
        String logoUrl,
        String phone,
        String email,
        String instagramUrl,
        String currency,
        boolean vatEnabled,
        BigDecimal vatRate,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static RestaurantResponse from(Restaurant r) {
        return new RestaurantResponse(
                r.getId(), r.getName(), r.getSlug(), r.getLogoUrl(), r.getPhone(), r.getEmail(),
                r.getInstagramUrl(), r.getCurrency(), r.isVatEnabled(), r.getVatRate(), r.isActive(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}
