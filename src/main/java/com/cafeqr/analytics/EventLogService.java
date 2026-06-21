package com.cafeqr.analytics;

import com.cafeqr.analytics.domain.AnalyticsEvent;
import com.cafeqr.analytics.domain.AnalyticsEventType;
import com.cafeqr.analytics.domain.OrderEventLog;
import com.cafeqr.analytics.domain.OrderEventType;
import com.cafeqr.analytics.repository.AnalyticsEventRepository;
import com.cafeqr.analytics.repository.OrderEventLogRepository;
import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Appends rows to {@code order_events} and {@code analytics_events}.
 *
 * <p>Recorder methods are fire-and-forget: they run inside the caller's
 * transaction so an event is either committed with the change it describes or
 * rolled back with it — no phantom events. They never throw into the caller;
 * attribution is best-effort and a missing actor is recorded as null.
 */
@Service
public class EventLogService {

    private final OrderEventLogRepository orderEventLogRepository;
    private final AnalyticsEventRepository analyticsEventRepository;

    public EventLogService(OrderEventLogRepository orderEventLogRepository,
                           AnalyticsEventRepository analyticsEventRepository) {
        this.orderEventLogRepository = orderEventLogRepository;
        this.analyticsEventRepository = analyticsEventRepository;
    }

    @Transactional
    public void recordOrderEvent(Order order, OrderStatus toStatus, String note) {
        OrderEventLog log = new OrderEventLog();
        log.setOrderId(order.getId());
        log.setRestaurantId(order.getRestaurantId());
        log.setBranchId(order.getBranchId());
        log.setEventType(OrderEventType.from(toStatus));
        // Anonymous (customer) on CREATED; the acting staff member on every dashboard transition.
        log.setActorUserId(SecurityUtils.currentUserIdOrNull());
        log.setActorName(SecurityUtils.currentUserNameOrNull());
        log.setNote(note);
        log.setCreatedAt(Instant.now());
        orderEventLogRepository.save(log);
    }

    @Transactional
    public void recordAnalyticsEvent(Long restaurantId, Long branchId, String deviceToken,
                                     String sessionToken, Long qrTableId,
                                     AnalyticsEventType eventType, Long menuItemId,
                                     Integer quantity, String payload) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setRestaurantId(restaurantId);
        event.setBranchId(branchId);
        event.setDeviceToken(deviceToken);
        event.setSessionToken(sessionToken);
        event.setQrTableId(qrTableId);
        event.setEventType(eventType);
        event.setMenuItemId(menuItemId);
        event.setQuantity(quantity);
        event.setPayload(payload);
        event.setCreatedAt(Instant.now());
        analyticsEventRepository.save(event);
    }
}