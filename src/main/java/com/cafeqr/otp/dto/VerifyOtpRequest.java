package com.cafeqr.otp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank @Size(max = 40) String phone,
        @NotBlank @Size(min = 6, max = 6) String code
) {}
