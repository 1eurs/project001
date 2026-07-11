package com.cafeqr.orders.print.domain;

public enum PrintJobStatus {
    PENDING,
    PRINTED,
    /** Sat unclaimed past the freshness window — never print a stale receipt on tablet wake. */
    EXPIRED
}
