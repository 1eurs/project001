package com.cafeqr.loyalty.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/** Café-set stamp-card configuration (dashboard, PATCH). */
public record LoyaltyProgramRequest(
        boolean enabled,
        @Min(1) @Max(50) int stampsRequired,
        @NotBlank @Size(max = 120) String rewardLabel,
        /** Menu items eligible as the free reward (customer picks one); may be empty while disabled. */
        @Size(max = 30) List<Long> rewardItemIds,
        @DecimalMin("0.0") BigDecimal minOrderAmount,
        /** Card accent hex (#RRGGBB); null = inherit the café's menu-skin accent. */
        @Size(max = 7) String cardColor,
        /** Card background hex; null = the surrounding skin's surface color. */
        @Size(max = 7) String cardBg,
        /** Emoji punched into earned stamps; blank falls back to '★'. */
        @Size(max = 8) String stampIcon,
        /** Watermark motif key (menu-theme motif set); null = none. */
        @Size(max = 12) String cardMotif
) {}
