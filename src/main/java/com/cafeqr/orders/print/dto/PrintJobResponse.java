package com.cafeqr.orders.print.dto;

import com.cafeqr.orders.dto.OrderResponse;
import com.cafeqr.orders.print.domain.PrintJob;

import java.time.Instant;

/** Carries the full order snapshot so the print station renders without extra round-trips. */
public record PrintJobResponse(
        Long id,
        Long orderId,
        Instant createdAt,
        OrderResponse order
) {
    public static PrintJobResponse of(PrintJob job, OrderResponse order) {
        return new PrintJobResponse(job.getId(), job.getOrderId(), job.getCreatedAt(), order);
    }
}
