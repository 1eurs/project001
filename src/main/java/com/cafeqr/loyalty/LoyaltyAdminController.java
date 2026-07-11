package com.cafeqr.loyalty;

import com.cafeqr.analytics.Entitlements;
import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.loyalty.dto.LoyaltyMemberResponse;
import com.cafeqr.loyalty.dto.LoyaltyProgramRequest;
import com.cafeqr.loyalty.dto.LoyaltyProgramResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Café-facing stamp-card configuration and members list. Pro-gated like Pro analytics
 * ({@link Entitlements#requirePro()} -> HTTP 402 PLAN_REQUIRED for STANDARD cafés).
 */
@RestController
@RequestMapping("/api/loyalty")
@PreAuthorize("hasAuthority('PROFILE')")
@Tag(name = "Loyalty")
public class LoyaltyAdminController {

    private final LoyaltyService loyaltyService;
    private final Entitlements entitlements;

    public LoyaltyAdminController(LoyaltyService loyaltyService, Entitlements entitlements) {
        this.loyaltyService = loyaltyService;
        this.entitlements = entitlements;
    }

    @Operation(summary = "Get the café's stamp-card configuration (Pro)")
    @GetMapping("/program")
    public ApiResponse<LoyaltyProgramResponse> getProgram() {
        entitlements.requirePro();
        return ApiResponse.ok(loyaltyService.getProgram());
    }

    @Operation(summary = "Create or update the café's stamp-card configuration (Pro)")
    @PatchMapping("/program")
    public ApiResponse<LoyaltyProgramResponse> updateProgram(@Valid @RequestBody LoyaltyProgramRequest request) {
        entitlements.requirePro();
        return ApiResponse.ok("Loyalty saved", loyaltyService.updateProgram(request));
    }

    @Operation(summary = "List the café's loyalty members (Pro)")
    @GetMapping("/members")
    public ApiResponse<List<LoyaltyMemberResponse>> members() {
        entitlements.requirePro();
        return ApiResponse.ok(loyaltyService.listMembers());
    }
}
