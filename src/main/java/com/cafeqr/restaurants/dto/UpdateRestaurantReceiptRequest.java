package com.cafeqr.restaurants.dto;

import jakarta.validation.constraints.Size;

/**
 * Receipt customization is a JSON document (style preset, logo toggle, footer text, VAT/CR
 * numbers) — same shape of contract as themeCustomJson: the frontend owns the schema and
 * the backend only guards "valid JSON object, sane size". Blank/null clears to defaults.
 */
public record UpdateRestaurantReceiptRequest(
        @Size(max = 4000)
        String receiptSettingsJson
) {}
