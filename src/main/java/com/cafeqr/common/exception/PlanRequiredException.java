package com.cafeqr.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a café on the STANDARD tier calls a Pro-only endpoint. Mapped to
 * HTTP 402 so the frontend can surface an "Upgrade to Pro" prompt rather than a
 * generic error.
 */
public class PlanRequiredException extends ApiException {

    public PlanRequiredException(String message) {
        super(HttpStatus.PAYMENT_REQUIRED, ErrorCode.PLAN_REQUIRED, message);
    }
}