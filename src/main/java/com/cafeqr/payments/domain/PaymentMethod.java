package com.cafeqr.payments.domain;

/**
 * How a payment was taken. Most cafe orders are settled in person, so {@link #CARD} (POS terminal)
 * and {@link #CASH} are the common cases; {@link #ONLINE} is reserved for a future gateway.
 */
public enum PaymentMethod {
    CASH,
    CARD,
    ONLINE,
    OTHER
}
