package com.cafeqr.orders.dto;

import com.cafeqr.orders.domain.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long menuItemId,
        String nameEn,
        String nameAr,
        BigDecimal price,
        int quantity,
        String note,
        BigDecimal lineTotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(), item.getMenuItemId(), item.getNameEnSnapshot(), item.getNameArSnapshot(),
                item.getPriceSnapshot(), item.getQuantity(), item.getNote(), item.getLineTotal());
    }
}
