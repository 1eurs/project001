package com.cafeqr.loyalty.domain;

/** Ledger entry kind: a stamp earned on an order, or a reward redeemed against one. */
public enum LoyaltyTxnType {
    EARN,
    REDEEM
}
