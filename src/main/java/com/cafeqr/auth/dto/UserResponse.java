package com.cafeqr.auth.dto;

import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        Long restaurantId,
        Long branchId,
        boolean active,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getRestaurantId(),
                user.getBranchId(),
                user.isActive(),
                user.getCreatedAt());
    }
}
