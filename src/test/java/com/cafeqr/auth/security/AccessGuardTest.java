package com.cafeqr.auth.security;

import com.cafeqr.common.exception.ForbiddenException;
import com.cafeqr.users.domain.Permission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.EnumSet;
import java.util.Set;

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
        authenticate(principal(1L, Set.of(Permission.PLATFORM_ADMIN), false, null, null));
        assertThatCode(() -> accessGuard.requireRestaurantAccess(999L)).doesNotThrowAnyException();
        assertThat(accessGuard.scopedRestaurantId()).isNull();
    }

    @Test
    void ownerIsConfinedToOwnRestaurant() {
        authenticate(principal(2L, Permission.ownerSet(), true, 10L, null));
        assertThatCode(() -> accessGuard.requireRestaurantAccess(10L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> accessGuard.requireRestaurantAccess(11L))
                .isInstanceOf(ForbiddenException.class);
        assertThat(accessGuard.scopedRestaurantId()).isEqualTo(10L);
        // Restaurant-wide users (no branch) are not branch-confined.
        assertThat(accessGuard.scopedBranchId()).isNull();
    }

    @Test
    void branchScopedUserIsConfinedToOwnBranch() {
        authenticate(principal(3L, Set.of(Permission.ORDERS, Permission.PAYMENTS), false, 10L, 55L));
        assertThatCode(() -> accessGuard.requireBranchAccess(10L, 55L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> accessGuard.requireBranchAccess(10L, 56L))
                .isInstanceOf(ForbiddenException.class);
        assertThat(accessGuard.scopedBranchId()).isEqualTo(55L);
    }

    @Test
    void branchScopedUserCannotReachAnotherRestaurant() {
        authenticate(principal(4L, Set.of(Permission.ORDERS), false, 10L, 55L));
        assertThatThrownBy(() -> accessGuard.requireBranchAccess(20L, 55L))
                .isInstanceOf(ForbiddenException.class);
    }

    private static CustomUserDetails principal(Long id, Set<Permission> perms, boolean owner,
                                               Long restaurantId, Long branchId) {
        return new CustomUserDetails(id, "user" + id, "h",
                EnumSet.copyOf(perms), owner, restaurantId, branchId, true);
    }
}
