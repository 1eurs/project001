package com.cafeqr.orders.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    PREPARING,
    READY,
    COMPLETED,
    CANCELLED;

    // ACCEPTED is the single "in progress" step (PREPARING merged in); DECLINED is merged into
    // CANCELLED. Both legacy values are kept for old rows but no longer produced — PREPARING can
    // still advance so any pre-merge in-progress ticket isn't stranded.
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            PENDING, EnumSet.of(ACCEPTED, CANCELLED),
            ACCEPTED, EnumSet.of(READY, CANCELLED),
            PREPARING, EnumSet.of(READY, CANCELLED),
            READY, EnumSet.of(COMPLETED),
            DECLINED, EnumSet.noneOf(OrderStatus.class),
            COMPLETED, EnumSet.noneOf(OrderStatus.class),
            CANCELLED, EnumSet.noneOf(OrderStatus.class)
    );

    public boolean canTransitionTo(OrderStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }

    public boolean isFinal() {
        return ALLOWED.getOrDefault(this, Set.of()).isEmpty();
    }
}
