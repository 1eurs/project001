package com.cafeqr.presence.event;

/** Fired when a branch's QR activity changes (heartbeat, leave, or new order) so the live SSE can push. */
public record PresenceChangedEvent(Long branchId) {}
