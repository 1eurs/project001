package com.cafeqr.analytics.dto;

/**
 * Restaurant-wide customer-base KPIs, derived from {@code customer_profiles} (lifetime counters,
 * like the regulars/at-risk lists — not windowed). {@code newCustomers} and {@code activeCustomers}
 * use a rolling 30-day window. {@code repeatOrderSharePercent} is the share of all orders that are
 * repeat visits: since every customer's first order is their own, repeat orders =
 * {@code SUM(orderCount) - totalCustomers}.
 */
public record CustomerBaseResponse(
        long totalCustomers,
        long repeatCustomers,
        int repeatRatePercent,
        double avgOrdersPerCustomer,
        long newCustomers,
        long activeCustomers,
        int repeatOrderSharePercent
) {}
