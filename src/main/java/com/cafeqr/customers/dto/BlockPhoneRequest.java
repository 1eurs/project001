package com.cafeqr.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlockPhoneRequest(
        @NotBlank @Size(max = 40) String phone,
        @Size(max = 300) String reason
) {}
