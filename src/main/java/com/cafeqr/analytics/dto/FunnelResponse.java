package com.cafeqr.analytics.dto;

/**
 * Customer-journey conversion funnel over a window. Every stage is counted the same
 * way — distinct browsing sessions (from {@code analytics_events}) that reached that
 * step — so the funnel is monotonic by construction.
 */
public record FunnelResponse(
        long menuViews,
        long addedToCart,
        long checkoutStarted,
        long ordersPlaced
) {
}
