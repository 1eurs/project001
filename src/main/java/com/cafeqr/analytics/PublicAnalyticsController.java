package com.cafeqr.analytics;

import com.cafeqr.analytics.dto.RecordAnalyticsEventRequest;
import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.tables.TableService;
import com.cafeqr.tables.domain.RestaurantTable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/analytics/events")
@Tag(name = "Public analytics")
public class PublicAnalyticsController {

    private final EventLogService eventLogService;
    private final RestaurantService restaurantService;
    private final TableService tableService;

    public PublicAnalyticsController(EventLogService eventLogService,
                                     RestaurantService restaurantService,
                                     TableService tableService) {
        this.eventLogService = eventLogService;
        this.restaurantService = restaurantService;
        this.tableService = tableService;
    }

    @Operation(summary = "Record a customer funnel event (menu view, cart, checkout)", security = {})
    @PostMapping
    public ApiResponse<Void> record(@Valid @RequestBody RecordAnalyticsEventRequest request) {
        Restaurant restaurant = restaurantService.getActiveBySlug(request.restaurantSlug());
        Long qrTableId = resolveQrTable(restaurant, request);
        eventLogService.recordAnalyticsEvent(
                restaurant.getId(),
                request.branchId(),
                request.deviceToken(),
                request.sessionToken(),
                qrTableId,
                request.eventType(),
                request.menuItemId(),
                request.quantity(),
                request.payload());
        return ApiResponse.message("Event recorded");
    }

    private Long resolveQrTable(Restaurant restaurant, RecordAnalyticsEventRequest request) {
        if (request.qrTableToken() == null || request.qrTableToken().isBlank()) {
            return null;
        }
        RestaurantTable table = tableService.getActiveByToken(request.qrTableToken());
        if (!table.getRestaurantId().equals(restaurant.getId())) {
            throw new BadRequestException(ErrorCode.TABLE_INVALID,
                    "Table does not belong to this restaurant");
        }
        return table.getId();
    }
}