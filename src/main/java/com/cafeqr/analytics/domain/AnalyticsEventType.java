package com.cafeqr.analytics.domain;

/**
 * Customer-side funnel events from the public QR menu. Captures the journey the
 * live PresenceService was discarding after 45s: views, cart edits, checkout.
 * Keyed by {@code device_token} so events can be stitched to a customer profile.
 */
public enum AnalyticsEventType {
    MENU_VIEW,
    CATEGORY_VIEW,
    ITEM_VIEW,
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    CHECKOUT_STARTED,
    ORDER_PLACED,
    ORDER_TRACKING_VIEW
}