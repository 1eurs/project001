package com.cafeqr.payments.dto;

import com.cafeqr.payments.domain.PaymentMethod;

/** Optional body for marking an order paid. Defaults to CARD (the common at-cafe case). */
public record MarkPaidRequest(
        PaymentMethod method
) {}
