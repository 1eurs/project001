package com.cafeqr.analytics.dto;

import java.time.Instant;

public record CustomerDirectoryResponse(
        String phone,
        String name,
        long orderCount,
        Instant lastOrderAt
) {}
