package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.AnalyticsSummaryResponse;
import com.cafeqr.analytics.dto.BestSellingItem;
import com.cafeqr.analytics.dto.HourlyCount;
import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.repository.OrderItemRepository;
import com.cafeqr.orders.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private static final int MONEY_SCALE = 3;
    private static final int DEFAULT_BEST_SELLING_LIMIT = 10;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AccessGuard accessGuard;

    public AnalyticsService(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            AccessGuard accessGuard) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.accessGuard = accessGuard;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse summary(Instant from, Instant to) {
        Long restaurantId = accessGuard.scopedRestaurantId();
        Long branchId = accessGuard.scopedBranchId();

        Map<OrderStatus, Long> counts = statusCounts(restaurantId, branchId, from, to);
        long total = counts.values().stream().mapToLong(Long::longValue).sum();

        BigDecimal revenue = orderRepository.sumTotalByStatus(
                restaurantId, branchId, OrderStatus.COMPLETED, from, to);
        long completed = counts.getOrDefault(OrderStatus.COMPLETED, 0L);
        BigDecimal aov = completed > 0
                ? revenue.divide(BigDecimal.valueOf(completed), MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return new AnalyticsSummaryResponse(
                from, to, total,
                counts.getOrDefault(OrderStatus.PENDING, 0L),
                counts.getOrDefault(OrderStatus.ACCEPTED, 0L),
                counts.getOrDefault(OrderStatus.DECLINED, 0L),
                counts.getOrDefault(OrderStatus.PREPARING, 0L),
                counts.getOrDefault(OrderStatus.READY, 0L),
                completed,
                counts.getOrDefault(OrderStatus.CANCELLED, 0L),
                revenue,
                aov,
                bestSelling(from, to, DEFAULT_BEST_SELLING_LIMIT),
                busiestHours(restaurantId, branchId, from, to));
    }

    @Transactional(readOnly = true)
    public List<BestSellingItem> bestSelling(Instant from, Instant to, int limit) {
        Long restaurantId = accessGuard.scopedRestaurantId();
        Long branchId = accessGuard.scopedBranchId();
        return orderItemRepository.bestSelling(restaurantId, branchId, from, to).stream()
                .limit(limit)
                .map(row -> new BestSellingItem(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).longValue(),
                        (BigDecimal) row[4]))
                .toList();
    }

    private Map<OrderStatus, Long> statusCounts(Long restaurantId, Long branchId, Instant from, Instant to) {
        Map<OrderStatus, Long> counts = new EnumMap<>(OrderStatus.class);
        for (Object[] row : orderRepository.countByStatus(restaurantId, branchId, from, to)) {
            counts.put((OrderStatus) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    private List<HourlyCount> busiestHours(Long restaurantId, Long branchId, Instant from, Instant to) {
        return orderRepository.busiestHours(restaurantId, branchId, from, to).stream()
                .map(row -> new HourlyCount(((Number) row[0]).intValue(), ((Number) row[1]).longValue()))
                .toList();
    }
}
