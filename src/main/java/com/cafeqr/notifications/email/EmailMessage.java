package com.cafeqr.notifications.email;

/** A transactional email to a single recipient. {@code html} is optional; {@code text} is the fallback. */
public record EmailMessage(
        String to,
        String subject,
        String html,
        String text
) {}
