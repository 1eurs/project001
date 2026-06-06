package com.cafeqr.restaurants.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateRestaurantThemeRequest(
        @NotBlank
        @Pattern(regexp = "onyx|qahwa|warda|mint|bahr|bahar|layl|sikka|majlis|azraq|nakhla|custom")
        String theme,
        @Size(max = 4000)
        String themeCustomJson
) {}
