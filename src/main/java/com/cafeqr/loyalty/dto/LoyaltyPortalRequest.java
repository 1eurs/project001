package com.cafeqr.loyalty.dto;

import jakarta.validation.constraints.NotBlank;

/** Cross-café portal entry: the OTP-verification token issued by /api/public/otp/verify. */
public record LoyaltyPortalRequest(
        @NotBlank String phoneToken
) {}
