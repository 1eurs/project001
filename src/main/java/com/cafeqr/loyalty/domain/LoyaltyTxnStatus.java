package com.cafeqr.loyalty.domain;

/**
 * Lifecycle of a ledger entry. EARN rows are written CONFIRMED. REDEEM rows are
 * reserved as PENDING when an order is placed, then flipped to CONFIRMED when the
 * order completes or VOID if it is cancelled (returning the reward to the member).
 */
public enum LoyaltyTxnStatus {
    PENDING,
    CONFIRMED,
    VOID
}
