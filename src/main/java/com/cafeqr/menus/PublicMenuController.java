package com.cafeqr.menus;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.menus.dto.PublicMenuResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public menu")
public class PublicMenuController {

    /**
     * Menus change a few times a day at most; letting browsers and the Cloudflare edge
     * serve them for 30s (and a stale copy for 5min while revalidating) takes the
     * Pi-origin round trip off the customer's critical path.
     */
    private static final String MENU_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=300";

    private final PublicMenuService publicMenuService;

    public PublicMenuController(PublicMenuService publicMenuService) {
        this.publicMenuService = publicMenuService;
    }

    @Operation(summary = "Get the restaurant-wide public menu", security = {})
    @GetMapping("/restaurants/{slug}/menu")
    public ApiResponse<PublicMenuResponse> restaurantMenu(@PathVariable String slug, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, MENU_CACHE_CONTROL);
        return ApiResponse.ok(publicMenuService.byRestaurantSlug(slug));
    }

    @Operation(summary = "Get a branch's public menu", security = {})
    @GetMapping("/restaurants/{slug}/branches/{branchId}/menu")
    public ApiResponse<PublicMenuResponse> branchMenu(@PathVariable String slug, @PathVariable Long branchId,
                                                      HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, MENU_CACHE_CONTROL);
        return ApiResponse.ok(publicMenuService.byBranch(slug, branchId));
    }

    @Operation(summary = "Get a menu by scanning a table QR token", security = {})
    @GetMapping("/qr/{tableToken}/menu")
    public ApiResponse<PublicMenuResponse> qrMenu(@PathVariable String tableToken, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, MENU_CACHE_CONTROL);
        return ApiResponse.ok(publicMenuService.byTableToken(tableToken));
    }
}
