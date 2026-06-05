package com.cafeqr.orders.dto;

import com.cafeqr.orders.domain.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank String restaurantSlug,
        @NotNull Long branchId,
        /** Required for DINE_IN; identifies the scanned table. */
        String tableToken,
        @NotNull OrderType orderType,
        @Size(max = 150) String customerName,
        @Size(max = 40) String customerPhone,
        @Size(max = 500) String customerNote,
        @NotEmpty @Valid List<Item> items
) {

    public record Item(
            @NotNull Long menuItemId,
            @Positive int quantity,
            @Size(max = 300) String note
    ) {}
}
