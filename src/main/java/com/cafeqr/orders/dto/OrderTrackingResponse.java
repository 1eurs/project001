package com.cafeqr.orders.dto;

import com.cafeqr.loyalty.dto.LoyaltySummaryResponse;
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
        String loyaltyRewardLabel,
        BigDecimal loyaltyRewardDiscount,
        /** This customer's stamp progress at the café (null/disabled when no active program). */
        LoyaltySummaryResponse loyalty,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant acceptedAt,
        Instant preparingAt,
        Instant readyAt,
        Instant completedAt,
        Instant cancelledAt,
        Instant declinedAt,
        /** True when this order actually earned a stamp on completion; false when it didn't qualify
         *  (below the café's minimum-order floor, or no member/phone); null before completion. Drives
         *  the post-order "a stamp was added" confirmation so it never lies about earning a stamp. */
        Boolean stampEarned
) {
    public static OrderTrackingResponse from(Order o) {
        return from(o, null, null);
    }

    public static OrderTrackingResponse from(Order o, LoyaltySummaryResponse loyalty) {
        return from(o, loyalty, null);
    }

    public static OrderTrackingResponse from(Order o, LoyaltySummaryResponse loyalty, Boolean stampEarned) {
        return new OrderTrackingResponse(
                o.getOrderNumber(), o.getTrackingToken(), o.getOrderType(), o.getStatus(), o.getPaymentStatus(),
                o.getSubtotal(), o.getVatAmount(), o.getTotal(), o.getPrepTimeMinutes(), o.getDeclineReason(),
                o.getCustomerName(), o.getCarPlate(), o.getCarColor(), o.getCustomerNote(),
                o.getLoyaltyRewardLabel(), o.getLoyaltyRewardDiscount(), loyalty,
                o.getItems().stream().map(OrderItemResponse::from).toList(),
                o.getCreatedAt(), o.getAcceptedAt(), o.getPreparingAt(), o.getReadyAt(),
                o.getCompletedAt(), o.getCancelledAt(), o.getDeclinedAt(), stampEarned);
    }
}
