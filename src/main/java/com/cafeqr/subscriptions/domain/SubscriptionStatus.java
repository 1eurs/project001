package com.cafeqr.subscriptions.domain;

public enum SubscriptionStatus {
    /** Café has signed up and been told to pay; awaiting admin confirmation of the bank transfer. */
    PENDING_PAYMENT,
    TRIAL,
    ACTIVE,
    PAST_DUE,
    CANCELLED,
    EXPIRED
}
