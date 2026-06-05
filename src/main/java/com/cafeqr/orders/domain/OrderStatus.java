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

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            PENDING, EnumSet.of(ACCEPTED, DECLINED, CANCELLED),
            ACCEPTED, EnumSet.of(PREPARING, CANCELLED),
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
