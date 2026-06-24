package com.cafeqr.restaurants.dto;

import com.cafeqr.restaurants.domain.Plan;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Admin-only restaurant creation. The restaurant is created active and on the chosen plan.
 * Optional nested blocks let the admin complete onboarding in one call instead of three:
 * <ul>
 *   <li>{@code owner} — creates the restaurant's primary/owner user (active, role
 *       {@code RESTAURANT_OWNER}). Omit it if the owner will be added later.</li>
 *   <li>{@code defaultBranchName} — creates a first branch. Defaults to the restaurant name.</li>
 *   <li>{@code plan} — STANDARD or PRO (or ENTERPRISE). Defaults to STANDARD; the admin
 *       upgrades to PRO at onboarding or later via the plan control.</li>
 * </ul>
 */
public record CreateRestaurantRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 150) String slug,
        @Size(max = 500) String logoUrl,
        @Size(max = 40) String phone,
        @Email @Size(max = 150) String email,
        @Size(max = 300) String instagramUrl,
        @Size(min = 3, max = 3) String currency,
        Boolean vatEnabled,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal vatRate,

        /** Pricing tier. {@code null} → defaults to PRO. */
        Plan plan,

        /** Name of the first branch to provision; {@code null} → uses the restaurant name. */
        @Size(max = 150) String defaultBranchName,

        /** Optional owner account created in the same call. */
        @Valid Owner owner
) {
    public record Owner(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 150) String email,
            @Size(max = 40) String phone,
            @NotBlank @Size(min = 8, max = 100) String password
    ) {}
}