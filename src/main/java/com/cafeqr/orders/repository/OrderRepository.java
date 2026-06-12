package com.cafeqr.orders.repository;

import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByTrackingToken(String trackingToken);

    @EntityGraph(attributePaths = "items")
    Optional<Order> findWithItemsById(Long id);

    @EntityGraph(attributePaths = "items")
    Optional<Order> findWithItemsByTrackingToken(String trackingToken);

    @Query(value = "SELECT nextval('order_number_seq')", nativeQuery = true)
    long nextOrderNumber();

    // -------- returning customers --------

    @EntityGraph(attributePaths = "items")
    Optional<Order> findFirstByRestaurantIdAndCustomerPhoneAndStatusNotInOrderByCreatedAtDesc(
            Long restaurantId, String customerPhone, Collection<OrderStatus> excludedStatuses);

    long countByRestaurantIdAndCustomerPhoneAndStatusNotIn(
            Long restaurantId, String customerPhone, Collection<OrderStatus> excludedStatuses);

    @Query("""
            SELECT o FROM Order o
            WHERE (:restaurantId IS NULL OR o.restaurantId = :restaurantId)
              AND (:branchId IS NULL OR o.branchId = :branchId)
              AND (:status IS NULL OR o.status = :status)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> search(@Param("restaurantId") Long restaurantId,
                       @Param("branchId") Long branchId,
                       @Param("status") OrderStatus status,
                       Pageable pageable);

    @EntityGraph(attributePaths = "items")
    @Query("""
            SELECT o FROM Order o
            WHERE (:restaurantId IS NULL OR o.restaurantId = :restaurantId)
              AND (:branchId IS NULL OR o.branchId = :branchId)
              AND o.status IN :statuses
            ORDER BY o.createdAt ASC
            """)
    List<Order> findLive(@Param("restaurantId") Long restaurantId,
                         @Param("branchId") Long branchId,
                         @Param("statuses") List<OrderStatus> statuses);

    // -------- analytics --------

    @Query("""
            SELECT o.status, COUNT(o) FROM Order o
            WHERE (:restaurantId IS NULL OR o.restaurantId = :restaurantId)
              AND (:branchId IS NULL OR o.branchId = :branchId)
              AND o.createdAt >= :from AND o.createdAt < :to
            GROUP BY o.status
            """)
    List<Object[]> countByStatus(@Param("restaurantId") Long restaurantId,
                                 @Param("branchId") Long branchId,
                                 @Param("from") Instant from,
                                 @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(o.total), 0) FROM Order o
            WHERE (:restaurantId IS NULL OR o.restaurantId = :restaurantId)
              AND (:branchId IS NULL OR o.branchId = :branchId)
              AND o.status = :status
              AND o.createdAt >= :from AND o.createdAt < :to
            """)
    java.math.BigDecimal sumTotalByStatus(@Param("restaurantId") Long restaurantId,
                                          @Param("branchId") Long branchId,
                                          @Param("status") OrderStatus status,
                                          @Param("from") Instant from,
                                          @Param("to") Instant to);

    @Query(value = """
            SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') AS hour, COUNT(*) AS cnt
            FROM orders
            WHERE (:restaurantId IS NULL OR restaurant_id = :restaurantId)
              AND (:branchId IS NULL OR branch_id = :branchId)
              AND created_at >= :from AND created_at < :to
            GROUP BY hour
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> busiestHours(@Param("restaurantId") Long restaurantId,
                                @Param("branchId") Long branchId,
                                @Param("from") Instant from,
                                @Param("to") Instant to);

    /**
     * Platform-wide per-restaurant order stats for the admin console, one grouped scan:
     * {@code [restaurantId, ordersInWindow, completedRevenueInWindow, ordersToday, ordersTotal, lastOrderAt]}.
     * Declined/cancelled orders are excluded from counts; revenue counts COMPLETED only.
     */
    @Query(value = """
            SELECT o.restaurant_id,
                   COUNT(*) FILTER (WHERE o.created_at >= :from
                                      AND o.status NOT IN ('DECLINED','CANCELLED'))           AS orders_window,
                   COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= :from
                                                   AND o.status = 'COMPLETED'), 0)            AS revenue_window,
                   COUNT(*) FILTER (WHERE o.created_at >= :today
                                      AND o.status NOT IN ('DECLINED','CANCELLED'))           AS orders_today,
                   COUNT(*) FILTER (WHERE o.status NOT IN ('DECLINED','CANCELLED'))           AS orders_total,
                   MAX(o.created_at)                                                          AS last_order_at
            FROM orders o
            GROUP BY o.restaurant_id
            """, nativeQuery = true)
    List<Object[]> platformOrderStats(@Param("from") Instant from, @Param("today") Instant today);

    /** Orders + revenue grouped per (table, type) for a branch since {@code from} — for QR activity. */
    @Query("""
            SELECT o.tableId, o.orderType, COUNT(o), COALESCE(SUM(o.total), 0) FROM Order o
            WHERE o.restaurantId = :restaurantId
              AND o.branchId = :branchId
              AND o.status NOT IN :excluded
              AND o.createdAt >= :from AND o.createdAt < :to
            GROUP BY o.tableId, o.orderType
            """)
    List<Object[]> qrActivityToday(@Param("restaurantId") Long restaurantId,
                                   @Param("branchId") Long branchId,
                                   @Param("excluded") List<OrderStatus> excluded,
                                   @Param("from") Instant from,
                                   @Param("to") Instant to);
}
