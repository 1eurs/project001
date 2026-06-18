package com.cafeqr.otp;

import com.cafeqr.common.api.ApiResponse;
import com.cafeqr.otp.dto.SendOtpRequest;
import com.cafeqr.otp.dto.VerifyOtpRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/otp")
@Tag(name = "Public OTP")
public class PublicOtpController {

    private final OtpService otpService;

    public PublicOtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @Operation(summary = "Send a 6-digit OTP to the customer's WhatsApp number", security = {})
    @PostMapping("/send")
    public ApiResponse<Void> send(@Valid @RequestBody SendOtpRequest request) {
        otpService.send(request.phone());
        return ApiResponse.ok("OTP sent — check your WhatsApp", null);
    }

    @Operation(summary = "Verify OTP code and receive a 30-day phone-verification token", security = {})
    @PostMapping("/verify")
    public ApiResponse<Map<String, String>> verify(@Valid @RequestBody VerifyOtpRequest request) {
        String token = otpService.verifyAndIssueToken(request.phone(), request.code());
        return ApiResponse.ok("Phone verified", Map.of("phoneToken", token));
    }
}
