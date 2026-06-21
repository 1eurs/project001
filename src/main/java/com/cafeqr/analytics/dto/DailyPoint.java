package com.cafeqr.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One day's rolled-up order count and completed revenue — a point on the analytics
 * trend chart. Days with no orders are still emitted (with zeros) by the service so
 * the frontend gets a continuous series.
 */
public record DailyPoint(LocalDate date, long orders, BigDecimal revenue) {}
