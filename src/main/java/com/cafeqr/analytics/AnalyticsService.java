package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.AnalyticsSummaryResponse;
import com.cafeqr.analytics.dto.BestSellingItem;
import com.cafeqr.analytics.dto.HourlyCount;
import com.cafeqr.analytics.dto.RestaurantStatsResponse;
import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.repository.BranchRepository;
import com.cafeqr.menus.repository.MenuItemRepository;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.repository.OrderItemRepository;
import com.cafeqr.orders.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AnalyticsService {

    private static final int MONEY_SCALE = 3;
    private static final int DEFAULT_BEST_SELLING_LIMIT = 10;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BranchRepository branchRepository;
    private final MenuItemRepository menuItemRepository;
    private final AccessGuard accessGuard;

    public AnalyticsService(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            BranchRepository branchRepository,
                            MenuItemRepository menuItemRepository,
                            AccessGuard accessGuard) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.branchRepository = branchRepository;
        this.menuItemRepository = menuItemRepository;
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
                        row[0] == null ? null : ((Number) row[0]).longValue(),
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).longValue(),
                        (BigDecimal) row[4]))
                .toList();
    }

    /**
     * Per-restaurant snapshot for the platform admin console — three grouped scans
     * (orders, branches, menu items) merged in memory, regardless of restaurant count.
     */
    @Transactional(readOnly = true)
    public List<RestaurantStatsResponse> platformRestaurantStats() {
        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant windowStart = Instant.now().minus(Duration.ofDays(30));

        Map<Long, Long> branches = countMap(branchRepository.countPerRestaurant());
        Map<Long, Long> menuItems = countMap(menuItemRepository.countPerRestaurant());
        List<Object[]> orderRows = orderRepository.platformOrderStats(windowStart, todayStart);

        Set<Long> ids = new HashSet<>(branches.keySet());
        ids.addAll(menuItems.keySet());

        Map<Long, RestaurantStatsResponse> stats = new HashMap<>();
        for (Object[] row : orderRows) {
            Long restaurantId = ((Number) row[0]).longValue();
            ids.remove(restaurantId);
            stats.put(restaurantId, new RestaurantStatsResponse(
                    restaurantId,
                    ((Number) row[3]).longValue(),
                    ((Number) row[1]).longValue(),
                    (BigDecimal) row[2],
                    ((Number) row[4]).longValue(),
                    toInstant(row[5]),
                    branches.getOrDefault(restaurantId, 0L),
                    menuItems.getOrDefault(restaurantId, 0L)));
        }
        // Restaurants that have branches/items but no orders yet still get a row.
        for (Long restaurantId : ids) {
            stats.put(restaurantId, new RestaurantStatsResponse(
                    restaurantId, 0, 0, BigDecimal.ZERO, 0, null,
                    branches.getOrDefault(restaurantId, 0L),
                    menuItems.getOrDefault(restaurantId, 0L)));
        }
        return List.copyOf(stats.values());
    }

    /** Native timestamptz values arrive as different temporal types depending on the JDBC mapping. */
    private static Instant toInstant(Object value) {
        return switch (value) {
            case null -> null;
            case Instant i -> i;
            case java.sql.Timestamp ts -> ts.toInstant();
            case java.time.OffsetDateTime odt -> odt.toInstant();
            default -> throw new IllegalStateException("Unexpected timestamp type: " + value.getClass());
        };
    }

    private static Map<Long, Long> countMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
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
