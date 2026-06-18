package com.cafeqr.auth.security;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.users.domain.Permission;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET =
            "Y2FmZXFyLXN1cGVyLXNlY3JldC1rZXktY2hhbmdlLW1lLWluLXByb2R1Y3Rpb24tMTIzNDU2";

    private final JwtService jwtService = new JwtService(new AppProperties(
            new AppProperties.Jwt(SECRET, 60, 30, "cafeqr"),
            null, "http://localhost:8080", null, null, null, null, null, null));

    @Test
    void generatesAndParsesTokenPreservingClaims() {
        Set<Permission> perms = EnumSet.of(Permission.ORDERS, Permission.PAYMENTS, Permission.MENU);
        CustomUserDetails principal = new CustomUserDetails(
                42L, "owner@cafe.com", "hash", perms, true, 7L, null, true);

        String token = jwtService.generateAccessToken(principal);
        CustomUserDetails parsed = jwtService.parsePrincipal(token);

        assertThat(parsed.getUserId()).isEqualTo(42L);
        assertThat(parsed.getUsername()).isEqualTo("owner@cafe.com");
        assertThat(parsed.getPermissions()).containsExactlyInAnyOrderElementsOf(perms);
        assertThat(parsed.isOwner()).isTrue();
        assertThat(parsed.getRestaurantId()).isEqualTo(7L);
        assertThat(parsed.getBranchId()).isNull();
    }

    @Test
    void rejectsTamperedToken() {
        CustomUserDetails principal = new CustomUserDetails(
                1L, "a@b.com", "hash", EnumSet.of(Permission.ORDERS), false, 1L, 1L, true);
        String token = jwtService.generateAccessToken(principal);

        assertThatThrownBy(() -> jwtService.parsePrincipal(token + "tampered"))
                .isInstanceOf(Exception.class);
    }
}
