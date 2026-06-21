package com.cafeqr.analytics.dto;

/**
 * Average fulfillment-stage durations (seconds) over the window, derived from the order
 * event log. Each stage averages only the orders that reached both ends of that stage, so a
 * field is {@code null} when no order has the data (e.g. nothing reached READY yet).
 *
 * <ul>
 *   <li>{@code acceptSeconds}   — order placed → first ACCEPTED event (how fast staff respond)</li>
 *   <li>{@code prepSeconds}     — ACCEPTED → READY (kitchen prep)</li>
 *   <li>{@code handoffSeconds}  — READY → COMPLETED (collection / curbside handoff)</li>
 *   <li>{@code toReadySeconds}  — placed → READY (total kitchen time)</li>
 *   <li>{@code toCompleteSeconds} — placed → COMPLETED (full order lifecycle)</li>
 * </ul>
 * {@code sampleOrders} is the number of non-cancelled orders that were at least accepted.
 */
public record KitchenTimingResponse(
        Double acceptSeconds,
        Double prepSeconds,
        Double handoffSeconds,
        Double toReadySeconds,
        Double toCompleteSeconds,
        long sampleOrders
) {}
