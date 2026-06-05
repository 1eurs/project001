package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.AnalyticsSummaryResponse;
import com.cafeqr.analytics.dto.BestSellingItem;
import com.cafeqr.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard/analytics")
@Tag(name = "Dashboard analytics")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Operation(summary = "Today's analytics summary")
    @GetMapping("/today")
    public ApiResponse<AnalyticsSummaryResponse> today() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return ApiResponse.ok(analyticsService.summary(startOfDay(today), startOfDay(today.plusDays(1))));
    }

    @Operation(summary = "Analytics summary for a date range")
    @GetMapping("/orders")
    public ApiResponse<AnalyticsSummaryResponse> orders(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(analyticsService.summary(startOfDay(from), startOfDay(to.plusDays(1))));
    }

    @Operation(summary = "Best-selling items for a date range")
    @GetMapping("/best-selling-items")
    public ApiResponse<List<BestSellingItem>> bestSelling(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(analyticsService.bestSelling(startOfDay(from), startOfDay(to.plusDays(1)), limit));
    }

    private static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
