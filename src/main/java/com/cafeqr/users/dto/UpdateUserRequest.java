package com.cafeqr.users.dto;

import com.cafeqr.users.domain.Permission;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Edits a staff account. All fields optional — only non-null fields are applied.
 * Pass {@code password} to reset it (the owner generates a new one and copies it out).
 */
public record UpdateUserRequest(
        @Size(max = 150) String fullName,
        @Size(max = 40) String phone,
        @Size(min = 8, max = 100) String password,
        Set<Permission> permissions,
        Long branchId
) {}
