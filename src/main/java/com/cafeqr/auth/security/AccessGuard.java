package com.cafeqr.auth.security;

import com.cafeqr.common.exception.ForbiddenException;
import org.springframework.stereotype.Component;

/**
 * Enforces tenant data isolation. Callers pass the {@code restaurantId} / {@code branchId}
 * of the resource being accessed (already loaded), so this guard needs no repositories.
 *
 * <p>Scoping is purely data-driven (no roles):
 * <ul>
 *   <li>platform admin ({@code restaurantId == null}) – unrestricted</li>
 *   <li>restaurant-wide user ({@code branchId == null}) – own restaurant, any branch</li>
 *   <li>branch-scoped user ({@code branchId != null}) – own branch only</li>
 * </ul>
 */
@Component
public class AccessGuard {

    /** Verifies the current user may act within the given restaurant. */
    public void requireRestaurantAccess(Long restaurantId) {
        CustomUserDetails user = SecurityUtils.currentUser();
        if (user.isPlatformAdmin()) {
            return;
        }
        if (user.getRestaurantId() == null || !user.getRestaurantId().equals(restaurantId)) {
            throw new ForbiddenException("You do not have access to this restaurant");
        }
    }

    /** Verifies the current user may act within the given branch (and its restaurant). */
    public void requireBranchAccess(Long restaurantId, Long branchId) {
        CustomUserDetails user = SecurityUtils.currentUser();
        if (user.isPlatformAdmin()) {
            return;
        }
        requireRestaurantAccess(restaurantId);
        if (isBranchScoped(user) && !user.getBranchId().equals(branchId)) {
            throw new ForbiddenException("You do not have access to this branch");
        }
    }

    /**
     * Restaurant id a list query should be limited to, or {@code null} for platform admin
     * (meaning: no restaurant restriction).
     */
    public Long scopedRestaurantId() {
        CustomUserDetails user = SecurityUtils.currentUser();
        return user.isPlatformAdmin() ? null : user.getRestaurantId();
    }

    /** Branch id a list query should be limited to, or {@code null} if the user is not branch-scoped. */
    public Long scopedBranchId() {
        CustomUserDetails user = SecurityUtils.currentUser();
        return isBranchScoped(user) ? user.getBranchId() : null;
    }

    private static boolean isBranchScoped(CustomUserDetails user) {
        return !user.isPlatformAdmin() && user.getBranchId() != null;
    }
}
