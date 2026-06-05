package com.cafeqr.notifications;

/** Channel-agnostic notification context. Future channels (WhatsApp/SMS/email) read from this. */
public record NotificationPayload(
        NotificationType type,
        Long restaurantId,
        Long branchId,
        Long orderId,
        String orderNumber,
        String recipientPhone,
        String message
) {}
