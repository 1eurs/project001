package com.cafeqr.analytics.dto;

import java.math.BigDecimal;

/**
 * Anonymous cross-café benchmark: where this café ranks among all Serva cafés on
 * the metrics owners care about. {@code percentile} is 0–100 (higher = better).
 * A platform admin querying a specific restaurant sees that restaurant's numbers.
 */
public record BenchmarkResponse(
        BigDecimal yourAov,
        BigDecimal medianAov,
        int aovPercentile,
        Double yourAcceptSeconds,
        Double medianAcceptSeconds,
        int acceptPercentile,
        long comparableCafes
) {
}