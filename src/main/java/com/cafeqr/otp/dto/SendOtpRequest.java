package com.cafeqr.otp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendOtpRequest(
        @NotBlank @Size(max = 40) String phone
) {}
