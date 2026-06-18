package com.cafeqr.subscriptions;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.subscriptions.dto.CreateSubscriptionRequest;
import com.cafeqr.subscriptions.dto.SubscriptionResponse;
import com.cafeqr.subscriptions.dto.UpdateSubscriptionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Subscriptions (admin)")
@PreAuthorize("hasAuthority('PLATFORM_ADMIN')")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Operation(summary = "Create a subscription for a restaurant")
    @PostMapping("/api/admin/restaurants/{restaurantId}/subscription")
    public ApiResponse<SubscriptionResponse> create(@PathVariable Long restaurantId,
                                                    @Valid @RequestBody CreateSubscriptionRequest request) {
        return ApiResponse.ok("Subscription created", subscriptionService.create(restaurantId, request));
    }

    @Operation(summary = "Get a restaurant's current subscription")
    @GetMapping("/api/admin/restaurants/{restaurantId}/subscription")
    public ApiResponse<SubscriptionResponse> get(@PathVariable Long restaurantId) {
        return ApiResponse.ok(subscriptionService.getForRestaurant(restaurantId));
    }

    @Operation(summary = "Update a subscription")
    @PatchMapping("/api/admin/subscriptions/{id}")
    public ApiResponse<SubscriptionResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateSubscriptionRequest request) {
        return ApiResponse.ok("Subscription updated", subscriptionService.update(id, request));
    }
}
