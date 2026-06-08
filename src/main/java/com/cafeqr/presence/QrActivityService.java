package com.cafeqr.presence;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.BranchService;
import com.cafeqr.branches.domain.Branch;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.domain.OrderType;
import com.cafeqr.orders.realtime.OrderStreamService;
import com.cafeqr.orders.repository.OrderRepository;
import com.cafeqr.presence.dto.LiveCount;
import com.cafeqr.presence.dto.QrActivityResponse;
import com.cafeqr.presence.dto.QrActivityResponse.DayStat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Combines live presence with today's per-QR order totals; serves both polled reads and SSE pushes. */
@Service
public class QrActivityService {

    /** Orders that don't count toward a QR's takings. */
    private static final List<OrderStatus> EXCLUDED = List.of(OrderStatus.DECLINED, OrderStatus.CANCELLED);

    private final OrderRepository orderRepository;
    private final PresenceService presenceService;
    private final BranchService branchService;
    private final AccessGuard accessGuard;
    private final OrderStreamService streamService;

    public QrActivityService(OrderRepository orderRepository,
                             PresenceService presenceService,
                             BranchService branchService,
                             AccessGuard accessGuard,
                             OrderStreamService streamService) {
        this.orderRepository = orderRepository;
        this.presenceService = presenceService;
        this.branchService = branchService;
        this.accessGuard = accessGuard;
        this.streamService = streamService;
    }

    /** One-shot read for the dashboard (access-checked). */
    @Transactional(readOnly = true)
    public QrActivityResponse forBranch(Long requestedBranchId) {
        Long branchId = resolveAccessibleBranch(requestedBranchId);
        return branchId == null ? empty() : snapshot(branchId);
    }

    /** Live SSE stream — pushes a fresh snapshot whenever the branch's activity changes. */
    public SseEmitter streamForDashboard(Long requestedBranchId) {
        Long branchId = resolveAccessibleBranch(requestedBranchId);
        SseEmitter emitter = streamService.subscribe(OrderStreamService.qaChannel(branchId == null ? 0L : branchId));
        try {
            emitter.send(SseEmitter.event().name("qr-activity").data(branchId == null ? empty() : snapshot(branchId)));
        } catch (IOException ignored) {
            // client already gone; the registry will clean it up
        }
        return emitter;
    }

    /** Builds the snapshot for a branch <b>without</b> an access check — used by the SSE broadcaster. */
    @Transactional(readOnly = true)
    public QrActivityResponse snapshot(Long branchId) {
        Branch branch = branchService.getEntity(branchId);

        Map<String, LiveCount> live = presenceService.liveCounts(branchId);
        int totalPresent = live.values().stream().mapToInt(LiveCount::present).sum();
        int totalOrdering = live.values().stream().mapToInt(LiveCount::ordering).sum();

        Instant from = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = Instant.now();
        Map<String, DayStat> today = new HashMap<>();
        for (Object[] row : orderRepository.qrActivityToday(branch.getRestaurantId(), branchId, EXCLUDED, from, to)) {
            Long tableId = (Long) row[0];
            OrderType type = (OrderType) row[1];
            int orders = ((Number) row[2]).intValue();
            BigDecimal revenue = (BigDecimal) row[3];
            String key = tableId != null ? String.valueOf(tableId) : typeKey(type);
            today.merge(key, new DayStat(orders, revenue),
                    (a, b) -> new DayStat(a.orders() + b.orders(), a.revenue().add(b.revenue())));
        }
        return new QrActivityResponse(totalPresent, totalOrdering, live, today);
    }

    private Long resolveAccessibleBranch(Long requestedBranchId) {
        Long branchScope = accessGuard.scopedBranchId();
        Long branchId = branchScope != null ? branchScope : requestedBranchId;
        if (branchId == null) {
            return null;
        }
        Branch branch = branchService.getEntity(branchId);
        accessGuard.requireRestaurantAccess(branch.getRestaurantId()); // 403 if not yours
        return branchId;
    }

    private static QrActivityResponse empty() {
        return new QrActivityResponse(0, 0, Map.of(), Map.of());
    }

    private static String typeKey(OrderType type) {
        return type == OrderType.CAR ? "car" : type == OrderType.TAKEAWAY ? "takeaway" : "other";
    }
}
