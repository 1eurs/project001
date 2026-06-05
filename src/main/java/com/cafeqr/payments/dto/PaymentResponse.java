package com.cafeqr.payments.dto;

import com.cafeqr.orders.domain.PaymentStatus;
import com.cafeqr.payments.domain.Payment;
import com.cafeqr.payments.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long orderId,
        String provider,
        String providerPaymentId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        PaymentMethod method,
        Instant createdAt,
        Instant updatedAt
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getOrderId(), p.getProvider(), p.getProviderPaymentId(), p.getAmount(),
                p.getCurrency(), p.getStatus(), p.getMethod(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
