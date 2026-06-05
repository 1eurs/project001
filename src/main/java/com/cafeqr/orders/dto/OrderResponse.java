package com.cafeqr.orders.dto;

import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.domain.OrderType;
import com.cafeqr.orders.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Full order view for the dashboard (includes line items and internal notes). */
public record OrderResponse(
        Long id,
        String orderNumber,
        String trackingToken,
        Long restaurantId,
        Long branchId,
        Long tableId,
        String customerName,
        String customerPhone,
        OrderType orderType,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal subtotal,
        BigDecimal vatAmount,
        BigDecimal total,
        Integer prepTimeMinutes,
        String declineReason,
        String customerNote,
        String internalNote,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant acceptedAt,
        Instant declinedAt,
        Instant preparingAt,
        Instant readyAt,
        Instant completedAt,
        Instant cancelledAt
) {
    public static OrderResponse from(Order o) {
        return new OrderResponse(
                o.getId(), o.getOrderNumber(), o.getTrackingToken(), o.getRestaurantId(), o.getBranchId(),
                o.getTableId(), o.getCustomerName(), o.getCustomerPhone(), o.getOrderType(), o.getStatus(),
                o.getPaymentStatus(), o.getSubtotal(), o.getVatAmount(), o.getTotal(), o.getPrepTimeMinutes(),
                o.getDeclineReason(), o.getCustomerNote(), o.getInternalNote(),
                o.getItems().stream().map(OrderItemResponse::from).toList(),
                o.getCreatedAt(), o.getAcceptedAt(), o.getDeclinedAt(), o.getPreparingAt(),
                o.getReadyAt(), o.getCompletedAt(), o.getCancelledAt());
    }
}
