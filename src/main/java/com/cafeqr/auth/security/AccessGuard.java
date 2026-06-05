package com.cafeqr.auth.security;

import com.cafeqr.common.exception.ForbiddenException;
import com.cafeqr.users.domain.Role;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

/**
 * Enforces tenant data isolation. Callers pass the {@code restaurantId} / {@code branchId}
 * of the resource being accessed (already loaded), so this guard needs no repositories.
 *
 * <ul>
 *   <li>{@link Role#PLATFORM_ADMIN} – unrestricted</li>
 *   <li>{@link Role#RESTAURANT_OWNER} – own restaurant, any branch</li>
 *   <li>{@link Role#BRANCH_MANAGER} – own restaurant, own branch</li>
 *   <li>{@link Role#STAFF}, {@link Role#KITCHEN_STAFF} – own branch only</li>
 * </ul>
 */
@Component
public class AccessGuard {

    private static final Set<Role> BRANCH_SCOPED =
            EnumSet.of(Role.BRANCH_MANAGER, Role.STAFF, Role.KITCHEN_STAFF);

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
        if (BRANCH_SCOPED.contains(user.getRole())
                && (user.getBranchId() == null || !user.getBranchId().equals(branchId))) {
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
        return BRANCH_SCOPED.contains(user.getRole()) ? user.getBranchId() : null;
    }
}
