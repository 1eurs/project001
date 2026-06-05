package com.cafeqr.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 150) String fullName,
        @Size(max = 40) String phone,
        @Size(min = 8, max = 100) String password
) {}
