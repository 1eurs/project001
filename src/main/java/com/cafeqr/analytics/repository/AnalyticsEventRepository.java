package com.cafeqr.analytics.repository;

import com.cafeqr.analytics.domain.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    /**
     * Per-item ITEM_VIEW counts for the conversion radar: how many times each item was
     * viewed vs. ordered in the window. Rows: {@code [menuItemId, nameEn, nameAr, views]}.
     * Deleted items (no matching menu_items row) surface with a placeholder name.
     */
    @Query(value = """
            SELECT ae.menu_item_id,
                   COALESCE(mi.name_en, '(deleted)'),
                   COALESCE(mi.name_ar, '(deleted)'),
                   COUNT(*) AS views
            FROM analytics_events ae
            LEFT JOIN menu_items mi ON mi.id = ae.menu_item_id
            WHERE ae.restaurant_id = :restaurantId
              AND (:branchId IS NULL OR ae.branch_id = :branchId)
              AND ae.event_type = 'ITEM_VIEW'
              AND ae.menu_item_id IS NOT NULL
              AND ae.created_at >= :from AND ae.created_at < :to
            GROUP BY ae.menu_item_id, mi.name_en, mi.name_ar
            """, nativeQuery = true)
    List<Object[]> itemViewCounts(@Param("restaurantId") Long restaurantId,
                                  @Param("branchId") Long branchId,
                                  @Param("from") Instant from,
                                  @Param("to") Instant to);

    /**
     * Conversion-funnel stage counts as distinct browsing sessions in the window.
     * Single row: {@code [menuViews, addedToCart, checkoutStarted, ordersPlaced]}.
     */
    @Query(value = """
            SELECT
              COUNT(DISTINCT session_token) FILTER (WHERE event_type = 'MENU_VIEW')        AS menu_views,
              COUNT(DISTINCT session_token) FILTER (WHERE event_type = 'ADD_TO_CART')      AS added_to_cart,
              COUNT(DISTINCT session_token) FILTER (WHERE event_type = 'CHECKOUT_STARTED') AS checkout_started,
              COUNT(DISTINCT session_token) FILTER (WHERE event_type = 'ORDER_PLACED')     AS orders_placed
            FROM analytics_events
            WHERE restaurant_id = :restaurantId
              AND (:branchId IS NULL OR branch_id = :branchId)
              AND session_token IS NOT NULL
              AND created_at >= :from AND created_at < :to
            """, nativeQuery = true)
    List<Object[]> funnelStages(@Param("restaurantId") Long restaurantId,
                                @Param("branchId") Long branchId,
                                @Param("from") Instant from,
                                @Param("to") Instant to);
}