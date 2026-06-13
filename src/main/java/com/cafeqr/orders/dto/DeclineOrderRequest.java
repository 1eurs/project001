package com.cafeqr.orders.dto;

import jakarta.validation.constraints.Size;

public record DeclineOrderRequest(
        @Size(max = 300) String reason
) {}
