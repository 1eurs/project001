package com.cafeqr.analytics.dto;

public record HourlyCount(
        int hour,
        long orders
) {}
