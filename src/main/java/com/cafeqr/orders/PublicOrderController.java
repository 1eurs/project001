package com.cafeqr.orders;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.orders.dto.CreateOrderRequest;
import com.cafeqr.orders.dto.OrderTrackingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/public/orders")
@Tag(name = "Public orders")
public class PublicOrderController {

    private final OrderService orderService;

    public PublicOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Place an order (customer)", security = {})
    @PostMapping
    public ApiResponse<OrderTrackingResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.ok("Order created successfully", orderService.createOrder(request));
    }

    @Operation(summary = "Track an order by tracking token", security = {})
    @GetMapping("/{trackingToken}")
    public ApiResponse<OrderTrackingResponse> track(@PathVariable String trackingToken) {
        return ApiResponse.ok(orderService.getTracking(trackingToken));
    }

    @Operation(summary = "Live order status stream (SSE)", security = {})
    @GetMapping(value = "/{trackingToken}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String trackingToken) {
        return orderService.streamForCustomer(trackingToken);
    }
}
