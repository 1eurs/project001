package com.cafeqr.orders.dto;

import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.domain.OrderType;
import com.cafeqr.orders.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Customer-facing order view (no internal notes). Returned by the public tracking endpoint. */
public record OrderTrackingResponse(
        String orderNumber,
        String trackingToken,
        OrderType orderType,
        OrderStatus status,
        PaymentStatus paymentStatus,
        BigDecimal subtotal,
        BigDecimal vatAmount,
        BigDecimal total,
        Integer prepTimeMinutes,
        String declineReason,
        String customerName,
        String carPlate,
        String carColor,
        String customerNote,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant acceptedAt,
        Instant preparingAt,
        Instant readyAt,
        Instant completedAt,
        Instant cancelledAt,
        Instant declinedAt
) {
    public static OrderTrackingResponse from(Order o) {
        return new OrderTrackingResponse(
                o.getOrderNumber(), o.getTrackingToken(), o.getOrderType(), o.getStatus(), o.getPaymentStatus(),
                o.getSubtotal(), o.getVatAmount(), o.getTotal(), o.getPrepTimeMinutes(), o.getDeclineReason(),
                o.getCustomerName(), o.getCarPlate(), o.getCarColor(), o.getCustomerNote(),
                o.getItems().stream().map(OrderItemResponse::from).toList(),
                o.getCreatedAt(), o.getAcceptedAt(), o.getPreparingAt(), o.getReadyAt(),
                o.getCompletedAt(), o.getCancelledAt(), o.getDeclinedAt());
    }
}
