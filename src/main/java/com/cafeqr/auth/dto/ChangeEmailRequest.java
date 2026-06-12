package com.cafeqr.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeEmailRequest(
        @NotBlank String currentPassword,
        @NotBlank @Email @Size(max = 150) String newEmail
) {}
