package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.AnalyticsSummaryResponse;
import com.cafeqr.analytics.dto.BestSellingItem;
import com.cafeqr.analytics.dto.DailyPoint;
import com.cafeqr.analytics.dto.DaypartPoint;
import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.common.exception.PlanRequiredException;
import com.cafeqr.common.util.TimeZones;
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
import java.util.List;

/**
 * Standard-tier analytics — available to every cafe on STANDARD or PRO. Pro-only extras
 * (funnel, staff leaderboard, forecast, benchmarking, …) live at {@link ProAnalyticsController}.
 *
 * <p>Standard is capped so there's a meaningful upsell to Pro:
 * <ul>
 *   <li>{@code /today} — always available (counts, revenue, AOV, best-sellers, busiest hours).</li>
 *   <li>{@code /orders?from&to} — Pro may pick any range; Standard is limited to the last 7
 *       days (longer windows throw 402 PLAN_REQUIRED with an upgrade hint).</li>
 *   <li>{@code /best-selling-items?limit} — Pro is unrestricted; Standard is capped at 5.</li>
 * </ul>
 * Platform admin bypasses every cap (preview).
 */
@RestController
@RequestMapping("/api/dashboard/analytics")
@Tag(name = "Dashboard analytics")
@PreAuthorize("hasAuthority('ANALYTICS')")
public class AnalyticsController {

    /** Best-seller row cap for STANDARD — Pro may pass a larger limit. */
    private static final int STANDARD_BEST_SELLING_LIMIT = 5;
    /** Date range cap (days) for STANDARD on the /orders endpoint. */
    private static final int STANDARD_RANGE_DAYS = 7;

    private final AnalyticsService analyticsService;
    private final Entitlements entitlements;

    public AnalyticsController(AnalyticsService analyticsService, Entitlements entitlements) {
        this.analyticsService = analyticsService;
        this.entitlements = entitlements;
    }

    @Operation(summary = "Today's analytics summary")
    @GetMapping("/today")
    public ApiResponse<AnalyticsSummaryResponse> today(
            @RequestParam(required = false) Long branchId) {
        LocalDate today = LocalDate.now(TimeZones.CAFES);
        return ApiResponse.ok(analyticsService.summary(startOfDay(today), startOfDay(today.plusDays(1)), branchId));
    }

    @Operation(summary = "Analytics summary for a date range")
    @GetMapping("/orders")
    public ApiResponse<AnalyticsSummaryResponse> orders(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long branchId) {
        if (!entitlements.isPro()) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
            if (days > STANDARD_RANGE_DAYS) {
                throw new PlanRequiredException(
                        "Your plan covers the last " + STANDARD_RANGE_DAYS + " days. "
                                + "Upgrade to Pro to query any date range.");
            }
        }
        return ApiResponse.ok(analyticsService.summary(startOfDay(from), startOfDay(to.plusDays(1)), branchId));
    }

    @Operation(summary = "Best-selling items for a date range")
    @GetMapping("/best-selling-items")
    public ApiResponse<List<BestSellingItem>> bestSelling(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) Long branchId) {
        int applied = limit;
        if (!entitlements.isPro()) {
            applied = Math.min(limit, STANDARD_BEST_SELLING_LIMIT);
        }
        return ApiResponse.ok(analyticsService.bestSelling(startOfDay(from), startOfDay(to.plusDays(1)), branchId, applied));
    }

    @Operation(summary = "Per-day orders & revenue for the trend chart")
    @GetMapping("/daily")
    public ApiResponse<List<DailyPoint>> daily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long branchId) {
        if (!entitlements.isPro()) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
            if (days > STANDARD_RANGE_DAYS) {
                throw new PlanRequiredException(
                        "Your plan covers the last " + STANDARD_RANGE_DAYS + " days. "
                                + "Upgrade to Pro to query any date range.");
            }
        }
        return ApiResponse.ok(analyticsService.dailyBreakdown(startOfDay(from), startOfDay(to.plusDays(1)), branchId));
    }

    @Operation(summary = "Orders & revenue grouped by part of the day")
    @GetMapping("/daypart")
    public ApiResponse<List<DaypartPoint>> daypart(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long branchId) {
        if (!entitlements.isPro()) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
            if (days > STANDARD_RANGE_DAYS) {
                throw new PlanRequiredException(
                        "Your plan covers the last " + STANDARD_RANGE_DAYS + " days. "
                                + "Upgrade to Pro to query any date range.");
            }
        }
        return ApiResponse.ok(analyticsService.daypartBreakdown(startOfDay(from), startOfDay(to.plusDays(1)), branchId));
    }

    private static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(TimeZones.CAFES).toInstant();
    }
}
