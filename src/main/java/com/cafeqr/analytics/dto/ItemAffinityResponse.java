package com.cafeqr.analytics.dto;

/** How often two items were ordered together. The bundle-suggestion primitive. */
public record ItemAffinityResponse(
        Long itemAId,
        String aNameEn,
        String aNameAr,
        Long itemBId,
        String bNameEn,
        String bNameAr,
        long coOrders
) {
}