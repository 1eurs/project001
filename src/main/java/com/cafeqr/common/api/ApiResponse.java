package com.cafeqr.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Consistent API envelope used by every endpoint.
 *
 * <p>Success: {@code { "success": true, "message": "...", "data": { ... } }}
 * <p>Error:   {@code { "success": false, "message": "...", "errorCode": "..." }}
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        String errorCode
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data, null);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static ApiResponse<Void> message(String message) {
        return new ApiResponse<>(true, message, null, null);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return new ApiResponse<>(false, message, null, errorCode);
    }
}
