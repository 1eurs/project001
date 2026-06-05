package com.cafeqr.auth.security;

import com.cafeqr.common.exception.ForbiddenException;
import com.cafeqr.users.domain.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccessGuardTest {

    private final AccessGuard accessGuard = new AccessGuard();

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(CustomUserDetails principal) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    void platformAdminCanAccessAnyRestaurant() {
        authenticate(new CustomUserDetails(1L, "admin@x.com", "h", Role.PLATFORM_ADMIN, null, null, true));
        assertThatCode(() -> accessGuard.requireRestaurantAccess(999L)).doesNotThrowAnyException();
        assertThat(accessGuard.scopedRestaurantId()).isNull();
    }

    @Test
    void ownerIsConfinedToOwnRestaurant() {
        authenticate(new CustomUserDetails(2L, "owner@x.com", "h", Role.RESTAURANT_OWNER, 10L, null, true));
        assertThatCode(() -> accessGuard.requireRestaurantAccess(10L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> accessGuard.requireRestaurantAccess(11L))
                .isInstanceOf(ForbiddenException.class);
        assertThat(accessGuard.scopedRestaurantId()).isEqualTo(10L);
    }

    @Test
    void branchManagerIsConfinedToOwnBranch() {
        authenticate(new CustomUserDetails(3L, "mgr@x.com", "h", Role.BRANCH_MANAGER, 10L, 55L, true));
        assertThatCode(() -> accessGuard.requireBranchAccess(10L, 55L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> accessGuard.requireBranchAccess(10L, 56L))
                .isInstanceOf(ForbiddenException.class);
        assertThat(accessGuard.scopedBranchId()).isEqualTo(55L);
    }

    @Test
    void staffCannotReachAnotherRestaurant() {
        authenticate(new CustomUserDetails(4L, "staff@x.com", "h", Role.STAFF, 10L, 55L, true));
        assertThatThrownBy(() -> accessGuard.requireBranchAccess(20L, 55L))
                .isInstanceOf(ForbiddenException.class);
    }
}
