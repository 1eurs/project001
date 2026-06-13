package com.cafeqr.restaurants;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.common.api.PageResponse;
import com.cafeqr.restaurants.dto.CreateRestaurantRequest;
import com.cafeqr.restaurants.dto.RestaurantResponse;
import com.cafeqr.restaurants.dto.UpdateRestaurantRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/restaurants")
@Tag(name = "Restaurants (admin)")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class RestaurantAdminController {

    private final RestaurantService restaurantService;

    public RestaurantAdminController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @Operation(summary = "Create a restaurant")
    @PostMapping
    public ApiResponse<RestaurantResponse> create(@Valid @RequestBody CreateRestaurantRequest request) {
        return ApiResponse.ok("Restaurant created", restaurantService.create(request));
    }

    @Operation(summary = "List restaurants")
    @GetMapping
    public ApiResponse<PageResponse<RestaurantResponse>> list(
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(restaurantService.list(active, pageable)));
    }

    @Operation(summary = "Get a restaurant by id")
    @GetMapping("/{id}")
    public ApiResponse<RestaurantResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(restaurantService.get(id));
    }

    @Operation(summary = "Update a restaurant")
    @PatchMapping("/{id}")
    public ApiResponse<RestaurantResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateRestaurantRequest request) {
        return ApiResponse.ok("Restaurant updated", restaurantService.update(id, request));
    }

    @Operation(summary = "Activate a restaurant")
    @PatchMapping("/{id}/activate")
    public ApiResponse<RestaurantResponse> activate(@PathVariable Long id) {
        return ApiResponse.ok("Restaurant activated", restaurantService.setActive(id, true));
    }

    @Operation(summary = "Deactivate a restaurant")
    @PatchMapping("/{id}/deactivate")
    public ApiResponse<RestaurantResponse> deactivate(@PathVariable Long id) {
        return ApiResponse.ok("Restaurant deactivated", restaurantService.setActive(id, false));
    }

    @Operation(summary = "Toggle the premium menu-look entitlement")
    @PatchMapping("/{id}/premium-look")
    public ApiResponse<RestaurantResponse> setPremiumLook(@PathVariable Long id, @RequestParam boolean enabled) {
        return ApiResponse.ok(enabled ? "Premium look enabled" : "Premium look disabled",
                restaurantService.setPremiumLook(id, enabled));
    }
}
