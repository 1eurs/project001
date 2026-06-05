package com.cafeqr.common.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends ApiException {

    public UnauthorizedException(ErrorCode errorCode, String message) {
        super(HttpStatus.UNAUTHORIZED, errorCode, message);
    }
}
