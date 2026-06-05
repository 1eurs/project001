package com.cafeqr.branches.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBranchRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 300) String address,
        @Size(max = 40) String phone,
        @Size(max = 500) String openingHours
) {}
