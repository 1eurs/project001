package com.cafeqr.menus;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.menus.dto.PublicMenuResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public menu")
public class PublicMenuController {

    private final PublicMenuService publicMenuService;

    public PublicMenuController(PublicMenuService publicMenuService) {
        this.publicMenuService = publicMenuService;
    }

    @Operation(summary = "Get the restaurant-wide public menu", security = {})
    @GetMapping("/restaurants/{slug}/menu")
    public ApiResponse<PublicMenuResponse> restaurantMenu(@PathVariable String slug) {
        return ApiResponse.ok(publicMenuService.byRestaurantSlug(slug));
    }

    @Operation(summary = "Get a branch's public menu", security = {})
    @GetMapping("/restaurants/{slug}/branches/{branchId}/menu")
    public ApiResponse<PublicMenuResponse> branchMenu(@PathVariable String slug, @PathVariable Long branchId) {
        return ApiResponse.ok(publicMenuService.byBranch(slug, branchId));
    }

    @Operation(summary = "Get a menu by scanning a table QR token", security = {})
    @GetMapping("/qr/{tableToken}/menu")
    public ApiResponse<PublicMenuResponse> qrMenu(@PathVariable String tableToken) {
        return ApiResponse.ok(publicMenuService.byTableToken(tableToken));
    }
}
