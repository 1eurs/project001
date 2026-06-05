package com.cafeqr.notifications;

/**
 * Abstraction over notification delivery. The first version logs only;
 * later implementations can fan out to WhatsApp / SMS / email.
 */
public interface NotificationService {

    void send(NotificationPayload payload);
}
