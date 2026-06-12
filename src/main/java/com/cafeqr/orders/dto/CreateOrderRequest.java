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
        /** Required for CAR orders; shown to staff for outdoor car delivery. */
        @Size(max = 40) String carPlate,
        /** Optional for CAR orders; helps staff spot the car (palette key, e.g. "white"). */
        @Size(max = 20) String carColor,
        @Size(max = 500) String customerNote,
        /** Browser-generated random token; lets the customer's device read back its own profile. */
        @Size(max = 64) String deviceToken,
        @NotEmpty @Valid List<Item> items
) {

    public record Item(
            @NotNull Long menuItemId,
            @Positive int quantity,
            @Size(max = 300) String note
    ) {}
}
