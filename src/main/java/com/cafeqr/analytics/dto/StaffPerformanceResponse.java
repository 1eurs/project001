package com.cafeqr.analytics.dto;

/** Per-staff order-handling stats: throughput, accept latency, decline rate. */
public record StaffPerformanceResponse(
        Long actorUserId,
        String actorName,
        long accepted,
        long declined,
        long completed,
        Double avgAcceptSeconds
) {
}