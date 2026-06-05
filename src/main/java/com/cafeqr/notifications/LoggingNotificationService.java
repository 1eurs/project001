package com.cafeqr.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Default notification channel: structured logging. Swap/extend for real channels later. */
@Service
public class LoggingNotificationService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger("notifications");

    @Override
    public void send(NotificationPayload payload) {
        log.info("[NOTIFY] type={} restaurant={} branch={} order={}({}) phone={} :: {}",
                payload.type(),
                payload.restaurantId(),
                payload.branchId(),
                payload.orderNumber(),
                payload.orderId(),
                payload.recipientPhone() != null ? payload.recipientPhone() : "-",
                payload.message());
    }
}
