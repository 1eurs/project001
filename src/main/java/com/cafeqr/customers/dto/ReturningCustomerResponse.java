package com.cafeqr.customers.dto;

import java.time.Instant;
import java.util.List;

/**
 * Everything the menu needs to greet a returning customer: saved contact/car details for
 * autofill, the time-decayed favorites, and the last order for one-tap reorder.
 * {@code orderCount} counts non-declined/cancelled orders placed with this phone, so the
 * frontend can decide whether the "your usual" signal is strong enough to show.
 */
public record ReturningCustomerResponse(
        String customerName,
        String customerPhone,
        String carPlate,
        String carColor,
        long orderCount,
        List<FavoriteItem> favorites,
        LastOrder lastOrder
) {

    public record FavoriteItem(
            Long menuItemId,
            String nameEn,
            String nameAr,
            long totalQuantity,
            long ordersContaining
    ) {}

    public record LastOrder(Instant createdAt, List<LastOrderItem> items) {}

    public record LastOrderItem(Long menuItemId, String nameEn, String nameAr, int quantity) {}
}
