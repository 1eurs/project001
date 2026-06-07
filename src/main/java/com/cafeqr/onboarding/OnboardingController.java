package com.cafeqr.onboarding;

import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.onboarding.dto.OnboardingInstructionsResponse;
import com.cafeqr.onboarding.dto.OnboardingSignupRequest;
import com.cafeqr.onboarding.dto.PendingOnboardingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @Operation(summary = "Self-serve café signup (public). Creates an inactive restaurant + owner "
            + "awaiting a bank transfer; returns the payment instructions.", security = {})
    @PostMapping("/api/public/onboarding")
    public ApiResponse<OnboardingInstructionsResponse> signup(@Valid @RequestBody OnboardingSignupRequest request) {
        return ApiResponse.ok("Signup received", onboardingService.signup(request));
    }

    @Operation(summary = "List cafés awaiting payment confirmation (platform admin)")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @GetMapping("/api/admin/onboarding")
    public ApiResponse<List<PendingOnboardingResponse>> listPending() {
        return ApiResponse.ok(onboardingService.listPending());
    }

    @Operation(summary = "Confirm a café's bank transfer — activates the restaurant + owner (platform admin)")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @PostMapping("/api/admin/onboarding/{restaurantId}/confirm")
    public ApiResponse<Void> confirm(@PathVariable Long restaurantId) {
        onboardingService.confirm(restaurantId, SecurityUtils.currentUser().getUserId());
        return ApiResponse.message("Payment confirmed");
    }

    @Operation(summary = "Reject a café's pending onboarding payment (platform admin)")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @PostMapping("/api/admin/onboarding/{restaurantId}/reject")
    public ApiResponse<Void> reject(@PathVariable Long restaurantId) {
        onboardingService.reject(restaurantId);
        return ApiResponse.message("Onboarding rejected");
    }

    @Operation(summary = "Confirm a renewal payment — extends the term and re-activates the café (platform admin)")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @PostMapping("/api/admin/onboarding/{restaurantId}/renew")
    public ApiResponse<Void> renew(@PathVariable Long restaurantId) {
        onboardingService.renew(restaurantId, SecurityUtils.currentUser().getUserId());
        return ApiResponse.message("Subscription renewed");
    }
}
