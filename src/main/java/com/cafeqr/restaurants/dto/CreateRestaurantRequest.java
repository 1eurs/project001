package com.cafeqr.restaurants.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateRestaurantRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 150) String slug,
        @Size(max = 500) String logoUrl,
        @Size(max = 40) String phone,
        @Email @Size(max = 150) String email,
        @Size(max = 300) String instagramUrl,
        @Size(min = 3, max = 3) String currency,
        Boolean vatEnabled,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal vatRate
) {}
