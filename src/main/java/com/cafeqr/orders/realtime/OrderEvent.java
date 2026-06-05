package com.cafeqr.orders.realtime;

/** A realtime event pushed over SSE. {@code type} maps to the SSE event name. */
public record OrderEvent(String type, Object data) {

    public static OrderEvent of(String type, Object data) {
        return new OrderEvent(type, data);
    }
}
