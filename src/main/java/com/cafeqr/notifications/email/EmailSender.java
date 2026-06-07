package com.cafeqr.notifications.email;

/**
 * Abstraction over transactional email delivery. Implementations must never throw to the
 * caller — a failed send is logged, not propagated, so it can't break the business flow.
 */
public interface EmailSender {

    void send(EmailMessage message);
}
