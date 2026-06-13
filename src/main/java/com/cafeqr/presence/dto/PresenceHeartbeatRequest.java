package com.cafeqr.presence.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/** A customer's "I'm still on the menu" ping, sent from the public menu/cart pages. */
public record PresenceHeartbeatRequest(
        @NotNull Long branchId,
        /** The table's qrCodeToken, or "car". */
        @NotBlank @Size(max = 80) String qrKey,
        /** Stable per browser tab so the same visitor isn't double-counted. */
        @NotBlank @Size(max = 80) String sessionId,
        /** "ordering" if they have items in cart / are at checkout; anything else = just viewing. */
        @Size(max = 20) String stage,
        /** What's in the cart right now (optional) so staff can see demand building up live. */
        @Size(max = 30) @Valid List<CartLine> cart
) {

    public record CartLine(@NotNull Long menuItemId, @Positive int quantity) {}
}
