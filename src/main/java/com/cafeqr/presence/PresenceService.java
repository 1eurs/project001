package com.cafeqr.presence;

import com.cafeqr.presence.dto.LiveCount;
import com.cafeqr.presence.dto.PresenceHeartbeatRequest.CartLine;
import com.cafeqr.presence.event.PresenceChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory presence registry: how many customers currently have a given QR's menu open, split
 * into "viewing" (just browsing) vs "ordering" (cart has items / at checkout). Keyed by
 * {@code branchId → qrKey → sessionId → Seen}; a session is live while it keeps heart-beating
 * (within {@link #TTL}). Single-instance only, like {@code OrderStreamService}.
 */
@Service
public class PresenceService {

    /** A session is considered active if seen within this window (heartbeat is every ~20s). */
    private static final Duration TTL = Duration.ofSeconds(45);

    private record Seen(Instant at, boolean ordering, List<CartLine> cart) {}

    private final Map<Long, Map<String, Map<String, Seen>>> store = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher events;

    public PresenceService(ApplicationEventPublisher events) {
        this.events = events;
    }

    /** {@code qrKey} = a table's qrCodeToken, or {@code "car"} / {@code "takeaway"}. */
    public void heartbeat(Long branchId, String qrKey, String sessionId, boolean ordering, List<CartLine> cart) {
        if (branchId == null || isBlank(qrKey) || isBlank(sessionId)) {
            return;
        }
        store.computeIfAbsent(branchId, b -> new ConcurrentHashMap<>())
                .computeIfAbsent(qrKey, k -> new ConcurrentHashMap<>())
                .put(sessionId, new Seen(Instant.now(), ordering, cart == null ? List.of() : List.copyOf(cart)));
        events.publishEvent(new PresenceChangedEvent(branchId));
    }

    /** A customer left (tab close / leave beacon) — drop them so the count falls immediately. */
    public void remove(Long branchId, String qrKey, String sessionId) {
        if (branchId == null || isBlank(qrKey) || isBlank(sessionId)) {
            return;
        }
        Map<String, Map<String, Seen>> byKey = store.get(branchId);
        Map<String, Seen> sessions = byKey != null ? byKey.get(qrKey) : null;
        if (sessions != null && sessions.remove(sessionId) != null) {
            events.publishEvent(new PresenceChangedEvent(branchId));
        }
    }

    /** Present + ordering counts per qrKey for a branch (expired sessions pruned on the way). */
    public Map<String, LiveCount> liveCounts(Long branchId) {
        Map<String, Map<String, Seen>> byKey = branchId != null ? store.get(branchId) : null;
        if (byKey == null) {
            return Map.of();
        }
        Instant cutoff = Instant.now().minus(TTL);
        Map<String, LiveCount> result = new HashMap<>();
        byKey.forEach((qrKey, sessions) -> {
            sessions.values().removeIf(s -> s.at().isBefore(cutoff));
            if (!sessions.isEmpty()) {
                int ordering = (int) sessions.values().stream().filter(Seen::ordering).count();
                result.put(qrKey, new LiveCount(sessions.size(), ordering));
            }
        });
        return result;
    }

    /**
     * Live cart contents per qrKey: quantities summed by menu item across the QR's active
     * sessions, so staff can see demand building up before the order is even placed.
     */
    public Map<String, Map<Long, Integer>> liveCarts(Long branchId) {
        Map<String, Map<String, Seen>> byKey = branchId != null ? store.get(branchId) : null;
        if (byKey == null) {
            return Map.of();
        }
        Instant cutoff = Instant.now().minus(TTL);
        Map<String, Map<Long, Integer>> result = new HashMap<>();
        byKey.forEach((qrKey, sessions) -> {
            Map<Long, Integer> totals = new HashMap<>();
            sessions.values().stream()
                    .filter(s -> !s.at().isBefore(cutoff))
                    .flatMap(s -> s.cart().stream())
                    .forEach(line -> totals.merge(line.menuItemId(), line.quantity(), Integer::sum));
            if (!totals.isEmpty()) {
                result.put(qrKey, totals);
            }
        });
        return result;
    }

    /** Evicts expired/empty entries so the map can't grow unbounded across branches over time. */
    @Scheduled(fixedDelay = 60_000L)
    void prune() {
        Instant cutoff = Instant.now().minus(TTL);
        store.values().forEach(byKey -> {
            byKey.values().forEach(sessions -> sessions.values().removeIf(s -> s.at().isBefore(cutoff)));
            byKey.values().removeIf(Map::isEmpty);
        });
        store.values().removeIf(Map::isEmpty);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
