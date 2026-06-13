package com.cafeqr.restaurants.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The look of the public menu is a JSON document (themeCustomJson) — presets are just
 * prefilled documents, so new themes never require a backend change. The theme id is a
 * label (which preset the JSON started from, or "custom"); legacy rows keep CSS-only ids.
 */
public record UpdateRestaurantThemeRequest(
        @NotBlank
        @Pattern(regexp = "[a-z][a-z0-9-]{0,39}", message = "theme must be a lowercase slug")
        String theme,
        @Size(max = 20000)
        String themeCustomJson
) {}
