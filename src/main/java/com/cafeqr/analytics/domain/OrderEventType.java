package com.cafeqr.analytics.domain;

import com.cafeqr.orders.domain.OrderStatus;

/**
 * One row per order lifecycle transition. Mirrors {@link OrderStatus} but is an
 * independent enum so the event log is decoupled from the order state machine
 * (future event types — e.g. PAYMENT_MARKED — can be added without touching orders).
 */
public enum OrderEventType {
    CREATED,
    ACCEPTED,
    DECLINED,
    PREPARING,
    READY,
    COMPLETED,
    CANCELLED;

    public static OrderEventType from(OrderStatus status) {
        if (status == OrderStatus.PENDING) return CREATED;
        return OrderEventType.valueOf(status.name());
    }
}