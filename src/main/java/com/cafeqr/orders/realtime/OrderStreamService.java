package com.cafeqr.orders.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory registry of Server-Sent Event emitters keyed by channel.
 *
 * <p>Channels:
 * <ul>
 *   <li>{@code restaurant:{id}} – every order in a restaurant (owner/admin dashboard)</li>
 *   <li>{@code branch:{id}} – orders for one branch (branch staff/kitchen dashboard)</li>
 *   <li>{@code order:{trackingToken}} – a single customer's order tracking stream</li>
 * </ul>
 * Suitable for a single-instance modular monolith (no external broker required).
 */
@Service
public class OrderStreamService {

    private static final Logger log = LoggerFactory.getLogger(OrderStreamService.class);
    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes

    private final Map<String, List<SseEmitter>> channels = new ConcurrentHashMap<>();

    public static String restaurantChannel(Long restaurantId) {
        return "restaurant:" + restaurantId;
    }

    public static String branchChannel(Long branchId) {
        return "branch:" + branchId;
    }

    public static String orderChannel(String trackingToken) {
        return "order:" + trackingToken;
    }

    /** Live QR-activity channel for one branch (dashboard Tables tab). */
    public static String qaChannel(Long branchId) {
        return "qa:" + branchId;
    }

    public boolean hasSubscribers(String channel) {
        List<SseEmitter> emitters = channels.get(channel);
        return emitters != null && !emitters.isEmpty();
    }

    public SseEmitter subscribe(String channel) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        channels.computeIfAbsent(channel, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(channel, emitter));
        emitter.onTimeout(() -> remove(channel, emitter));
        emitter.onError(e -> remove(channel, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            remove(channel, emitter);
        }
        return emitter;
    }

    public void publish(String channel, OrderEvent event) {
        List<SseEmitter> emitters = channels.get(channel);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(event.type()).data(event.data()));
            } catch (Exception e) {
                log.debug("Dropping dead SSE emitter on {}: {}", channel, e.getMessage());
                remove(channel, emitter);
            }
        }
    }

    public void publishAll(Collection<String> targetChannels, OrderEvent event) {
        targetChannels.forEach(channel -> publish(channel, event));
    }

    private void remove(String channel, SseEmitter emitter) {
        List<SseEmitter> emitters = channels.get(channel);
        if (emitters != null) {
            emitters.remove(emitter);
        }
    }
}
