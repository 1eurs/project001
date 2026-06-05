package com.cafeqr.users.dto;

import com.cafeqr.users.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(max = 40) String phone,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotNull Role role,
        /** Required when PLATFORM_ADMIN creates a restaurant user; otherwise inferred from the creator. */
        Long restaurantId,
        /** Required for branch-level roles (BRANCH_MANAGER, STAFF, KITCHEN_STAFF). */
        Long branchId
) {}
