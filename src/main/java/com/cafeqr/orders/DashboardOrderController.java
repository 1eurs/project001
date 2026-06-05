package com.cafeqr.orders;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.common.api.PageResponse;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.dto.AcceptOrderRequest;
import com.cafeqr.orders.dto.CancelOrderRequest;
import com.cafeqr.orders.dto.DeclineOrderRequest;
import com.cafeqr.orders.dto.OrderResponse;
import com.cafeqr.orders.dto.OrderSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/orders")
@Tag(name = "Dashboard orders")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF','KITCHEN_STAFF')")
public class DashboardOrderController {

    private final OrderService orderService;

    public DashboardOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "List orders (paged, filterable by status and branch)")
    @GetMapping
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long branchId,
            Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(orderService.listForDashboard(status, branchId, pageable)));
    }

    @Operation(summary = "List active (live) orders with line items")
    @GetMapping("/live")
    public ApiResponse<List<OrderResponse>> live(@RequestParam(required = false) Long branchId) {
        return ApiResponse.ok(orderService.liveForDashboard(branchId));
    }

    @Operation(summary = "Get an order by id")
    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponse> get(@PathVariable Long orderId) {
        return ApiResponse.ok(orderService.getForDashboard(orderId));
    }

    @Operation(summary = "Accept a pending order (optionally set prep time)")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF')")
    @PatchMapping("/{orderId}/accept")
    public ApiResponse<OrderResponse> accept(@PathVariable Long orderId,
                                             @Valid @RequestBody(required = false) AcceptOrderRequest request) {
        return ApiResponse.ok("Order accepted", orderService.accept(orderId, request));
    }

    @Operation(summary = "Decline a pending order")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF')")
    @PatchMapping("/{orderId}/decline")
    public ApiResponse<OrderResponse> decline(@PathVariable Long orderId,
                                              @Valid @RequestBody DeclineOrderRequest request) {
        return ApiResponse.ok("Order declined", orderService.decline(orderId, request.reason()));
    }

    @Operation(summary = "Move an accepted order to preparing")
    @PatchMapping("/{orderId}/preparing")
    public ApiResponse<OrderResponse> preparing(@PathVariable Long orderId) {
        return ApiResponse.ok("Order is now preparing", orderService.markPreparing(orderId));
    }

    @Operation(summary = "Mark a preparing order as ready")
    @PatchMapping("/{orderId}/ready")
    public ApiResponse<OrderResponse> ready(@PathVariable Long orderId) {
        return ApiResponse.ok("Order is ready", orderService.markReady(orderId));
    }

    @Operation(summary = "Complete a ready order")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF')")
    @PatchMapping("/{orderId}/complete")
    public ApiResponse<OrderResponse> complete(@PathVariable Long orderId) {
        return ApiResponse.ok("Order completed", orderService.complete(orderId));
    }

    @Operation(summary = "Cancel an order")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','RESTAURANT_OWNER','BRANCH_MANAGER','STAFF')")
    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<OrderResponse> cancel(@PathVariable Long orderId,
                                             @Valid @RequestBody(required = false) CancelOrderRequest request) {
        String reason = request != null ? request.reason() : null;
        return ApiResponse.ok("Order cancelled", orderService.cancel(orderId, reason));
    }

    @Operation(summary = "Dashboard live order stream (SSE)")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(required = false) Long branchId) {
        return orderService.streamForDashboard(branchId);
    }
}
