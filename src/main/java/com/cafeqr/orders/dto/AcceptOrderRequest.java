package com.cafeqr.orders.dto;

import jakarta.validation.constraints.Positive;

public record AcceptOrderRequest(
        @Positive Integer prepTimeMinutes
) {}
