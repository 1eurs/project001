package com.cafeqr.menus.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAvailabilityRequest(
        @NotNull Boolean available
) {}
