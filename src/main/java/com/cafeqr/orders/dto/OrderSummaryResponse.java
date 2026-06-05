package com.cafeqr.orders.dto;

import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.domain.OrderType;
import com.cafeqr.orders.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

/** Lightweight order row for paged dashboard lists (no line items). */
public record OrderSummaryResponse(
        Long id,
        String orderNumber,
        Long branchId,
        Long tableId,
        String customerName,
        OrderType orderType,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal total,
        Integer prepTimeMinutes,
        Instant createdAt
) {
    public static OrderSummaryResponse from(Order o) {
        return new OrderSummaryResponse(
                o.getId(), o.getOrderNumber(), o.getBranchId(), o.getTableId(), o.getCustomerName(),
                o.getOrderType(), o.getStatus(), o.getPaymentStatus(), o.getTotal(),
                o.getPrepTimeMinutes(), o.getCreatedAt());
    }
}
