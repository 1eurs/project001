package com.cafeqr.onboarding.dto;

import java.math.BigDecimal;

/**
 * Returned right after signup: how much to transfer, where, and the reference to cite
 * so a platform admin can reconcile and activate the account.
 */
public record OnboardingInstructionsResponse(
        String slug,
        String reference,
        BigDecimal amount,
        String currency,
        String bankName,
        String accountName,
        String accountNumber,
        String iban
) {}
