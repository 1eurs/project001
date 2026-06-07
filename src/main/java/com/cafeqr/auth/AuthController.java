package com.cafeqr.auth;

import com.cafeqr.auth.dto.AuthResponse;
import com.cafeqr.auth.dto.ForgotPasswordRequest;
import com.cafeqr.auth.dto.LoginRequest;
import com.cafeqr.auth.dto.RefreshRequest;
import com.cafeqr.auth.dto.RegisterPlatformAdminRequest;
import com.cafeqr.auth.dto.ResetPasswordRequest;
import com.cafeqr.auth.dto.UserResponse;
import com.cafeqr.auth.security.CustomUserDetails;
import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Register the first platform admin (only works while none exists)",
            security = {})
    @PostMapping("/register-platform-admin")
    public ApiResponse<AuthResponse> registerPlatformAdmin(@Valid @RequestBody RegisterPlatformAdminRequest request) {
        return ApiResponse.ok("Platform admin registered", authService.registerPlatformAdmin(request));
    }

    @Operation(summary = "Log in and obtain access + refresh tokens", security = {})
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful", authService.login(request));
    }

    @Operation(summary = "Exchange a refresh token for a new token pair", security = {})
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request));
    }

    @Operation(summary = "Request a password-reset link (always succeeds; no account enumeration)",
            security = {})
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ApiResponse.message("If that email is registered, we've sent a reset link.");
    }

    @Operation(summary = "Set a new password using a reset token", security = {})
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ApiResponse.message("Password updated — you can now sign in.");
    }

    @Operation(summary = "Revoke all refresh tokens for the current user",
            security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        authService.logout(SecurityUtils.currentUser().getUserId());
        return ApiResponse.message("Logged out");
    }

    @Operation(summary = "Get the currently authenticated user",
            security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        CustomUserDetails current = SecurityUtils.currentUser();
        return ApiResponse.ok(authService.currentUser(current.getUserId()));
    }
}
