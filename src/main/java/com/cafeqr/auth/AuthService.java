package com.cafeqr.auth;

import com.cafeqr.auth.domain.PasswordResetToken;
import com.cafeqr.auth.domain.RefreshToken;
import com.cafeqr.auth.dto.AuthResponse;
import com.cafeqr.auth.dto.LoginRequest;
import com.cafeqr.auth.dto.RefreshRequest;
import com.cafeqr.auth.dto.RegisterPlatformAdminRequest;
import com.cafeqr.auth.dto.UserResponse;
import com.cafeqr.auth.event.PasswordResetRequestedEvent;
import com.cafeqr.auth.repository.PasswordResetTokenRepository;
import com.cafeqr.auth.repository.RefreshTokenRepository;
import com.cafeqr.auth.security.CustomUserDetails;
import com.cafeqr.auth.security.JwtService;
import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.exception.UnauthorizedException;
import com.cafeqr.common.util.Tokens;
import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    /** How long a password-reset link stays valid. */
    private static final long RESET_TTL_MINUTES = 60;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final ApplicationEventPublisher events;
    private final long refreshTtlDays;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       ApplicationEventPublisher events,
                       AppProperties appProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.events = events;
        this.refreshTtlDays = appProperties.jwt().refreshTokenTtlDays();
    }

    @Transactional
    public AuthResponse registerPlatformAdmin(RegisterPlatformAdminRequest request) {
        if (userRepository.existsByRole(Role.PLATFORM_ADMIN)) {
            throw new ConflictException(ErrorCode.CONFLICT,
                    "A platform admin already exists. Ask an existing admin to create more accounts.");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.PLATFORM_ADMIN);
        user.setActive(true);
        userRepository.save(user);

        return issueTokens(CustomUserDetails.from(user), user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getUserId()));
        return issueTokens(principal, user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.TOKEN_INVALID, "Invalid refresh token"));
        if (!stored.isActive()) {
            throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED, "Refresh token expired or revoked");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", stored.getUserId()));
        if (!user.isActive()) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED, "Account is deactivated");
        }

        // Rotate: revoke the used token, issue a fresh pair.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(CustomUserDetails.from(user), user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    /**
     * Issues a single-use reset token and emails a link. Always returns normally regardless of
     * whether the email exists, so callers can't enumerate accounts.
     */
    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (!user.isActive()) {
                return; // disabled accounts (e.g. awaiting onboarding payment) can't reset
            }
            passwordResetTokenRepository.invalidateAllForUser(user.getId());

            PasswordResetToken token = new PasswordResetToken();
            token.setUserId(user.getId());
            token.setToken(Tokens.random(48));
            token.setExpiresAt(Instant.now().plus(RESET_TTL_MINUTES, ChronoUnit.MINUTES));
            token.setUsed(false);
            token.setCreatedAt(Instant.now());
            passwordResetTokenRepository.save(token);

            // Emailed after commit (so a rollback never sends a live reset link).
            events.publishEvent(new PasswordResetRequestedEvent(
                    user.getEmail(), user.getFullName(), token.getToken()));
        });
    }

    /** Consumes a reset token, sets the new password, and revokes existing sessions. */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(rawToken)
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> new BadRequestException(
                        ErrorCode.TOKEN_INVALID, "This reset link is invalid or has expired"));

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", token.getUserId()));
        user.setPasswordHash(passwordEncoder.encode(newPassword));

        token.setUsed(true);
        refreshTokenRepository.revokeAllForUser(user.getId()); // force re-login everywhere
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
    }

    private AuthResponse issueTokens(CustomUserDetails principal, User user) {
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = createRefreshToken(user.getId());
        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTtlSeconds(),
                UserResponse.from(user));
    }

    private String createRefreshToken(Long userId) {
        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setToken(Tokens.random(48));
        token.setExpiresAt(Instant.now().plus(refreshTtlDays, ChronoUnit.DAYS));
        token.setRevoked(false);
        token.setCreatedAt(Instant.now());
        refreshTokenRepository.save(token);
        return token.getToken();
    }
}
