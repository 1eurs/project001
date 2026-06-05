package com.cafeqr.orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeclineOrderRequest(
        @NotBlank @Size(max = 300) String reason
) {}
