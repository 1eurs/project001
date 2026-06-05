package com.cafeqr.leads.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Public "request access / book a demo" submission from the landing page. */
public record CreateLeadRequest(
        @NotBlank @Size(max = 150) String cafeName,
        @NotBlank @Size(max = 150) String contactName,
        @Size(max = 40) String phone,
        @Email @Size(max = 150) String email,
        @Size(max = 100) String city,
        @Size(max = 1000) String note
) {}
