package com.cafeqr.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public self-serve signup from the landing page. Creates an inactive restaurant + a
 * disabled owner account; the café then pays the one-time fee by bank transfer.
 */
public record OnboardingSignupRequest(
        @NotBlank @Size(max = 150) String cafeName,
        /** Optional preferred slug; auto-derived from the name when blank. */
        @Size(max = 80) String slug,
        @NotBlank @Size(max = 150) String ownerName,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(max = 40) String phone,
        @NotBlank @Size(min = 8, max = 100) String password
) {}
