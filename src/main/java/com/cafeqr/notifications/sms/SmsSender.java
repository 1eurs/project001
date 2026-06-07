package com.cafeqr.notifications.sms;

/**
 * Abstraction over SMS delivery. Implementations must never throw to the caller — a failed send
 * is logged, not propagated. Swap the implementation for a cheaper Oman gateway or WhatsApp later.
 */
public interface SmsSender {

    void send(String toPhone, String message);
}
