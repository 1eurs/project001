package com.cafeqr.analytics.dto;

import java.math.BigDecimal;

/**
 * Orders + completed revenue bucketed into a part of the day (café timezone). {@code daypart}
 * is one of MORNING / MIDDAY / AFTERNOON / EVENING / LATE; the service always emits all five
 * in order, filling empty buckets with zeros so the frontend can render a stable row set.
 * Order/revenue semantics mirror the daily trend: orders exclude declined/cancelled, revenue
 * counts completed only.
 */
public record DaypartPoint(String daypart, long orders, BigDecimal revenue) {}
