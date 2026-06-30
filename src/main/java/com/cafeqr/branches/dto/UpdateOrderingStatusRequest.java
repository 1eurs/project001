package com.cafeqr.branches.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateOrderingStatusRequest(
        @NotNull Boolean acceptingOrders
) {}
