package com.cafeqr.payments.repository;

import com.cafeqr.payments.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.Instant;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderIdOrderByIdDesc(Long orderId);

    @Query(value = """
            SELECT latest.method,
                   COUNT(*) AS payment_count,
                   COALESCE(SUM(latest.amount), 0) AS revenue
            FROM (
                SELECT DISTINCT ON (p.order_id)
                       p.order_id, p.method, p.amount
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                WHERE o.restaurant_id = :restaurantId
                  AND (:branchId IS NULL OR o.branch_id = :branchId)
                  AND o.created_at >= :from
                  AND o.created_at < :to
                  AND p.status = 'PAID'
                  AND p.method IN ('CASH', 'CARD')
                ORDER BY p.order_id, p.id DESC
            ) latest
            GROUP BY latest.method
            ORDER BY latest.method
            """, nativeQuery = true)
    List<Object[]> revenueByMethod(@Param("restaurantId") Long restaurantId,
                                   @Param("branchId") Long branchId,
                                   @Param("from") Instant from,
                                   @Param("to") Instant to);
}
