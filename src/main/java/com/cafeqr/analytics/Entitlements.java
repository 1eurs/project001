package com.cafeqr.analytics;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.common.exception.PlanRequiredException;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Plan;
import com.cafeqr.restaurants.domain.Restaurant;
import org.springframework.stereotype.Component;

/**
 * Tier gate for Pro analytics. Reads the current user's restaurant plan via
 * {@link AccessGuard} + {@link RestaurantService}; a platform admin (no
 * restaurant scope) is always granted Pro so they can preview the features.
 */
@Component
public class Entitlements {

    private final AccessGuard accessGuard;
    private final RestaurantService restaurantService;

    public Entitlements(AccessGuard accessGuard, RestaurantService restaurantService) {
        this.accessGuard = accessGuard;
        this.restaurantService = restaurantService;
    }

    /** True if the current caller's café is on PRO or ENTERPRISE (or is the platform admin). */
    public boolean isPro() {
        Long restaurantId = accessGuard.scopedRestaurantId();
        if (restaurantId == null) {
            return true; // platform admin — always Pro
        }
        Restaurant restaurant = restaurantService.getEntity(restaurantId);
        Plan plan = restaurant.getPlan();
        return plan == Plan.PRO || plan == Plan.ENTERPRISE;
    }

    /** Throws 402 PLAN_REQUIRED if the current caller's café is not on PRO. */
    public void requirePro() {
        if (!isPro()) {
            throw new PlanRequiredException(
                    "This insight is part of the Pro plan. Upgrade to unlock it.");
        }
    }
}