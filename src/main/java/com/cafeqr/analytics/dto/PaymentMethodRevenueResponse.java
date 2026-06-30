package com.cafeqr.analytics.dto;

import java.math.BigDecimal;

public record PaymentMethodRevenueResponse(
        String method,
        long paymentCount,
        BigDecimal revenue
) {}
