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
}
