package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.RestaurantStatsResponse;
import com.cafeqr.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/restaurants/stats")
@Tag(name = "Platform analytics")
@PreAuthorize("hasAuthority('PLATFORM_ADMIN')")
public class PlatformAnalyticsController {

    private final AnalyticsService analyticsService;

    public PlatformAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Operation(summary = "Per-restaurant activity stats (orders today/30d, revenue 30d, last order, branches, items)")
    @GetMapping
    public ApiResponse<List<RestaurantStatsResponse>> stats() {
        return ApiResponse.ok(analyticsService.platformRestaurantStats());
    }
}
