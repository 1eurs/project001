package com.cafeqr.auth;

import com.cafeqr.auth.domain.RefreshToken;
import com.cafeqr.auth.repository.PasswordResetTokenRepository;
import com.cafeqr.auth.repository.RefreshTokenRepository;
import com.cafeqr.auth.security.CustomUserDetails;
import com.cafeqr.auth.security.JwtService;
import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
    private final PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);

    private AuthService authService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.Jwt("secret", 60, 90, "cafeqr"),
                null, null, null, null, null, null, null, null);
        authService = new AuthService(userRepository, refreshTokenRepository, passwordResetTokenRepository,
                jwtService, passwordEncoder, authenticationManager, events, props);
        when(jwtService.generateAccessToken(any(CustomUserDetails.class))).thenReturn("new-access-token");
        when(jwtService.getAccessTtlSeconds()).thenReturn(3600L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void changeEmailVerifiesPasswordUpdatesEmailAndIssuesFreshSession() {
        User user = user(7L, "owner@old.test");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Owner123!", "hash")).thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("owner@new.test")).thenReturn(Optional.empty());

        var auth = authService.changeEmail(7L, "Owner123!", " owner@new.test ");

        assertThat(user.getEmail()).isEqualTo("owner@new.test");
        assertThat(auth.accessToken()).isEqualTo("new-access-token");
        assertThat(auth.user().email()).isEqualTo("owner@new.test");
        assertThat(auth.refreshToken()).isNotBlank();
        verify(refreshTokenRepository).revokeAllForUser(7L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void changeEmailRejectsDuplicateEmail() {
        User user = user(7L, "owner@old.test");
        User existing = user(8L, "owner@new.test");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Owner123!", "hash")).thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("owner@new.test")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> authService.changeEmail(7L, "Owner123!", "owner@new.test"))
                .isInstanceOf(ConflictException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    @Test
    void updateProfileTrimsNameAndPhone() {
        User user = user(7L, "owner@test.test");
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        var updated = authService.updateProfile(7L, "  New Owner  ", "  +96890000000  ");

        assertThat(user.getFullName()).isEqualTo("New Owner");
        assertThat(user.getPhone()).isEqualTo("+96890000000");
        assertThat(updated.fullName()).isEqualTo("New Owner");
        assertThat(updated.phone()).isEqualTo("+96890000000");
    }

    private static User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setFullName("Owner");
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setRole(Role.RESTAURANT_OWNER);
        user.setRestaurantId(1L);
        user.setActive(true);
        user.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return user;
    }
}
