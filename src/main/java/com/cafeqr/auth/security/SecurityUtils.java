package com.cafeqr.auth.security;

import com.cafeqr.common.exception.ApiException;
import com.cafeqr.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Convenience accessors for the currently authenticated principal. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CustomUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }

    /**
     * Id of the currently authenticated user, or {@code null} when the call is
     * anonymous (public endpoints). Used for event attribution where the actor
     * may be absent — e.g. a customer placing an order vs. staff accepting one.
     */
    public static Long currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails principal)) {
            return null;
        }
        return principal.getUserId();
    }

    /**
     * Display name of the currently authenticated user, or {@code null} when
     * anonymous. Snapshot alongside {@link #currentUserIdOrNull()} into event
     * logs so historical actor names survive a user being renamed or deleted.
     */
    public static String currentUserNameOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails principal)) {
            return null;
        }
        return principal.getUsername();
    }
}
