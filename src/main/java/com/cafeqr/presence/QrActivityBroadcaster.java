package com.cafeqr.presence;

import com.cafeqr.orders.realtime.OrderEvent;
import com.cafeqr.orders.realtime.OrderStreamService;
import com.cafeqr.presence.event.PresenceChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pushes fresh QR-activity snapshots over SSE when a branch changes. Changes (heartbeats, leaves,
 * new orders) only mark the branch "dirty"; a 500ms flusher coalesces bursts into at most one
 * snapshot per branch per tick, and skips branches no dashboard is watching — so it feels instant
 * without hammering the DB.
 */
@Component
public class QrActivityBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(QrActivityBroadcaster.class);

    private final OrderStreamService streamService;
    private final QrActivityService qrActivityService;
    private final Set<Long> dirty = ConcurrentHashMap.newKeySet();

    public QrActivityBroadcaster(OrderStreamService streamService, QrActivityService qrActivityService) {
        this.streamService = streamService;
        this.qrActivityService = qrActivityService;
    }

    @EventListener
    public void onChange(PresenceChangedEvent event) {
        if (event.branchId() != null) {
            dirty.add(event.branchId());
        }
    }

    @Scheduled(fixedDelay = 500L)
    void flush() {
        if (dirty.isEmpty()) {
            return;
        }
        for (Long branchId : List.copyOf(dirty)) {
            dirty.remove(branchId);
            String channel = OrderStreamService.qaChannel(branchId);
            if (!streamService.hasSubscribers(channel)) {
                continue; // nobody watching — don't bother querying
            }
            try {
                streamService.publish(channel, OrderEvent.of("qr-activity", qrActivityService.snapshot(branchId)));
            } catch (Exception e) {
                log.debug("QR activity broadcast failed for branch {}: {}", branchId, e.getMessage());
            }
        }
    }
}
