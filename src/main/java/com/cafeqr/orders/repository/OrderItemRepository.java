package com.cafeqr.orders.repository;

import com.cafeqr.orders.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
            SELECT oi.menuItemId, oi.nameEnSnapshot, oi.nameArSnapshot,
                   SUM(oi.quantity), SUM(oi.lineTotal)
            FROM OrderItem oi
            JOIN oi.order o
            WHERE (:restaurantId IS NULL OR o.restaurantId = :restaurantId)
              AND (:branchId IS NULL OR o.branchId = :branchId)
              AND o.status <> com.cafeqr.orders.domain.OrderStatus.DECLINED
              AND o.status <> com.cafeqr.orders.domain.OrderStatus.CANCELLED
              AND o.createdAt >= :from AND o.createdAt < :to
            GROUP BY oi.menuItemId, oi.nameEnSnapshot, oi.nameArSnapshot
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> bestSelling(@Param("restaurantId") Long restaurantId,
                               @Param("branchId") Long branchId,
                               @Param("from") Instant from,
                               @Param("to") Instant to);

    /**
     * Top seller name + total quantity for one restaurant — used by the weekly email job
     * which runs without a security context (so it can't use {@link #bestSelling} which
     * relies on AccessGuard scoping). Rows: {@code [nameEn, totalQuantity]}.
     */
    @Query(value = """
            SELECT oi.name_en_snapshot AS name_en,
                   SUM(oi.quantity)    AS total_qty
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.restaurant_id = :restaurantId
              AND o.status NOT IN ('DECLINED', 'CANCELLED')
              AND oi.menu_item_id IS NOT NULL
              AND o.created_at >= :from AND o.created_at < :to
            GROUP BY oi.name_en_snapshot
            ORDER BY total_qty DESC
            LIMIT 1
            """, nativeQuery = true)
    List<Object[]> topSellerName(@Param("restaurantId") Long restaurantId,
                                 @Param("from") Instant from,
                                 @Param("to") Instant to);

    /**
     * Market-basket co-occurrence: how often each pair of items appeared in the same order.
     * Self-pairs and duplicates excluded by {@code a.menu_item_id < b.menu_item_id}. A pair
     * must co-occur in at least {@code MIN_CO_ORDERS} distinct orders to be reported — a single
     * order containing N items would otherwise emit C(N,2) pairs all tied at 1, which reads as
     * "lots of signal" but is really one transaction. Rows:
     * {@code [itemAId, aNameEn, aNameAr, itemBId, bNameEn, bNameAr, coOrders]}.
     */
    @Query(value = """
            SELECT a.menu_item_id,
                   MAX(a.name_en_snapshot) AS a_name_en,
                   MAX(a.name_ar_snapshot) AS a_name_ar,
                   b.menu_item_id,
                   MAX(b.name_en_snapshot) AS b_name_en,
                   MAX(b.name_ar_snapshot) AS b_name_ar,
                   COUNT(DISTINCT a.order_id) AS co_orders
            FROM order_items a
            JOIN order_items b ON a.order_id = b.order_id AND a.menu_item_id < b.menu_item_id
            JOIN orders o ON o.id = a.order_id
            WHERE (:restaurantId IS NULL OR o.restaurant_id = :restaurantId)
              AND (:branchId IS NULL OR o.branch_id = :branchId)
              AND o.status NOT IN ('DECLINED', 'CANCELLED')
              AND a.menu_item_id IS NOT NULL
              AND b.menu_item_id IS NOT NULL
              AND o.created_at >= :from AND o.created_at < :to
            GROUP BY a.menu_item_id, b.menu_item_id
            HAVING COUNT(DISTINCT a.order_id) >= 2
            ORDER BY co_orders DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> itemAffinity(@Param("restaurantId") Long restaurantId,
                                @Param("branchId") Long branchId,
                                @Param("from") Instant from,
                                @Param("to") Instant to,
                                @Param("limit") int limit);
}
