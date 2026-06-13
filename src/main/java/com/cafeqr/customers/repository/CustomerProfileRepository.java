package com.cafeqr.customers.repository;

import com.cafeqr.customers.domain.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    Optional<CustomerProfile> findByRestaurantIdAndDeviceToken(Long restaurantId, String deviceToken);

    /**
     * Time-decayed personal item frequency ("your usual"), the TIFU-style scoring that simple
     * repeat-consumption literature shows is near-unbeatable for food reorders: each ordered unit
     * counts {@code 0.9^age_in_weeks}, so favorites adapt when tastes change. Scans only this
     * customer's history (idx_orders_restaurant_phone), no training or background jobs.
     *
     * <p>Rows: {@code [menuItemId, nameEn, nameAr, totalQuantity, ordersContaining, score]}.
     */
    @Query(value = """
            SELECT oi.menu_item_id,
                   MAX(oi.name_en_snapshot)  AS name_en,
                   MAX(oi.name_ar_snapshot)  AS name_ar,
                   SUM(oi.quantity)          AS total_qty,
                   COUNT(DISTINCT o.id)      AS orders_containing,
                   SUM(oi.quantity * EXP(-0.10536
                       * GREATEST(EXTRACT(EPOCH FROM (NOW() - o.created_at)), 0) / 604800.0)) AS score
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.restaurant_id = :restaurantId
              AND o.customer_phone = :phone
              AND oi.menu_item_id IS NOT NULL
              AND o.status NOT IN ('DECLINED', 'CANCELLED')
            GROUP BY oi.menu_item_id
            ORDER BY score DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> favoriteItems(@Param("restaurantId") Long restaurantId,
                                 @Param("phone") String phone,
                                 @Param("limit") int limit);
}
