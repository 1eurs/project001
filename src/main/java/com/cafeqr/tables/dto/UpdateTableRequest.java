package com.cafeqr.tables.dto;

import jakarta.validation.constraints.Size;

public record UpdateTableRequest(
        @Size(max = 40) String tableNumber,
        Boolean active
) {}
