package com.cafeqr.loyalty;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.loyalty.dto.LoyaltyPortalEntryResponse;
import com.cafeqr.loyalty.dto.LoyaltyPortalRequest;
import com.cafeqr.loyalty.dto.LoyaltySummaryResponse;
import com.cafeqr.otp.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Customer-facing loyalty: per-café checkout/menu summary and the OTP-gated cross-café portal. */
@RestController
@RequestMapping("/api/public/loyalty")
@Tag(name = "Public loyalty")
@Validated
public class PublicLoyaltyController {

    private final LoyaltyService loyaltyService;
    private final OtpService otpService;

    public PublicLoyaltyController(LoyaltyService loyaltyService, OtpService otpService) {
        this.loyaltyService = loyaltyService;
        this.otpService = otpService;
    }

    @Operation(summary = "Stamp progress for one café + phone (checkout/menu)", security = {})
    @GetMapping("/summary")
    public ApiResponse<LoyaltySummaryResponse> summary(
            @RequestParam @NotBlank String slug,
            @RequestParam @NotBlank @Size(max = 40) String phone) {
        return ApiResponse.ok(loyaltyService.summaryFor(slug, phone));
    }

    @Operation(summary = "Cross-café stamp cards for an OTP-verified phone", security = {})
    @PostMapping("/me")
    public ApiResponse<List<LoyaltyPortalEntryResponse>> me(@Valid @RequestBody LoyaltyPortalRequest request) {
        String phone = otpService.phoneFromToken(request.phoneToken());
        if (phone == null) {
            throw new BadRequestException("Your session expired. Please verify your number again.");
        }
        return ApiResponse.ok(loyaltyService.portalFor(phone));
    }
}
