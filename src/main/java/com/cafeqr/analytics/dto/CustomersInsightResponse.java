package com.cafeqr.analytics.dto;

import java.util.List;

/** Returning-customer insights: your most loyal regulars and the ones going quiet. */
public record CustomersInsightResponse(
        List<CustomerInsightResponse> topRegulars,
        List<CustomerInsightResponse> atRisk
) {
}