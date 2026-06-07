package com.cafeqr.subscriptions.domain;

/**
 * How a café pays the platform for its subscription. Only bank transfer for now;
 * an online gateway (Thawani/Tap) can be added later.
 */
public enum PaymentMethod {
    BANK_TRANSFER
}
