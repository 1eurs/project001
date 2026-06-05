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
}
