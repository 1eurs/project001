package com.cafeqr.presence.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Live funnel + today's takings per QR for a branch.
 *
 * @param totalPresent  customers on any of the branch's menus right now
 * @param totalOrdering how many of those are actively ordering (cart/checkout)
 * @param liveByKey     present + ordering keyed by qrCodeToken (tables) / "car" / "takeaway"
 * @param cartsByKey    what those customers have in their carts right now (same keys); a soft
 *                      signal — carts change until the order is placed
 * @param todayByKey    today's orders + revenue keyed by table id (string) / "car" / "takeaway"
 */
public record QrActivityResponse(
        int totalPresent,
        int totalOrdering,
        Map<String, LiveCount> liveByKey,
        Map<String, List<CartItemView>> cartsByKey,
        Map<String, DayStat> todayByKey
) {
    public record DayStat(int orders, BigDecimal revenue) {}

    public record CartItemView(Long menuItemId, String nameEn, String nameAr, int quantity) {}
}
