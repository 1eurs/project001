package com.cafeqr.customers;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.auth.security.SecurityUtils;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.util.Phones;
import com.cafeqr.customers.domain.BlockedPhone;
import com.cafeqr.customers.domain.CustomerProfile;
import com.cafeqr.customers.dto.BlockedPhoneResponse;
import com.cafeqr.customers.dto.ReturningCustomerResponse;
import com.cafeqr.customers.repository.BlockedPhoneRepository;
import com.cafeqr.customers.repository.CustomerProfileRepository;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.repository.OrderRepository;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Returning-customer features: device-token profiles (autofill), favorite-order scoring
 * ("your usual"), and the per-restaurant blocked-phone list.
 */
@Service
public class CustomerService {

    /** Orders that never happened don't count toward favorites or last-order reorder. */
    private static final List<OrderStatus> EXCLUDED_STATUSES =
            List.of(OrderStatus.DECLINED, OrderStatus.CANCELLED);
    private static final int FAVORITES_LIMIT = 5;

    private final CustomerProfileRepository profileRepository;
    private final BlockedPhoneRepository blockedPhoneRepository;
    private final OrderRepository orderRepository;
    private final RestaurantService restaurantService;
    private final AccessGuard accessGuard;

    public CustomerService(CustomerProfileRepository profileRepository,
                           BlockedPhoneRepository blockedPhoneRepository,
                           OrderRepository orderRepository,
                           RestaurantService restaurantService,
                           AccessGuard accessGuard) {
        this.profileRepository = profileRepository;
        this.blockedPhoneRepository = blockedPhoneRepository;
        this.orderRepository = orderRepository;
        this.restaurantService = restaurantService;
        this.accessGuard = accessGuard;
    }

    // ============================================================ order-flow hooks

    /** True when this (already normalized) phone is on the restaurant's blocklist. */
    @Transactional(readOnly = true)
    public boolean isBlocked(Long restaurantId, String normalizedPhone) {
        return normalizedPhone != null
                && blockedPhoneRepository.existsByRestaurantIdAndPhone(restaurantId, normalizedPhone);
    }

    /** Upserts the device's profile from a freshly placed order. No-op without a device token. */
    @Transactional
    public void recordOrder(Order order, String deviceToken) {
        if (deviceToken == null || deviceToken.isBlank()) {
            return;
        }
        CustomerProfile profile = profileRepository
                .findByRestaurantIdAndDeviceToken(order.getRestaurantId(), deviceToken)
                .orElseGet(() -> {
                    CustomerProfile p = new CustomerProfile();
                    p.setRestaurantId(order.getRestaurantId());
                    p.setDeviceToken(deviceToken);
                    return p;
                });
        // Only overwrite with values the customer actually provided this time.
        if (order.getCustomerName() != null) {
            profile.setCustomerName(order.getCustomerName());
        }
        if (order.getCustomerPhone() != null) {
            profile.setCustomerPhone(order.getCustomerPhone());
        }
        if (order.getCarPlate() != null) {
            profile.setCarPlate(order.getCarPlate());
        }
        if (order.getCarColor() != null) {
            profile.setCarColor(order.getCarColor());
        }
        profile.setOrderCount(profile.getOrderCount() + 1);
        profile.setLastOrderAt(Instant.now());
        profileRepository.save(profile);
    }

    // ============================================================ customer (public)

    /**
     * Profile + favorites + last order for the device token, or {@code null} when this
     * device has never ordered here (the frontend treats that as "new customer").
     */
    @Transactional(readOnly = true)
    public ReturningCustomerResponse returning(String restaurantSlug, String deviceToken) {
        Restaurant restaurant = restaurantService.getActiveBySlug(restaurantSlug);
        CustomerProfile profile = profileRepository
                .findByRestaurantIdAndDeviceToken(restaurant.getId(), deviceToken)
                .orElse(null);
        if (profile == null) {
            return null;
        }

        String phone = profile.getCustomerPhone();
        long orderCount = 0;
        List<ReturningCustomerResponse.FavoriteItem> favorites = List.of();
        ReturningCustomerResponse.LastOrder lastOrder = null;

        if (phone != null) {
            orderCount = orderRepository.countByRestaurantIdAndCustomerPhoneAndStatusNotIn(
                    restaurant.getId(), phone, EXCLUDED_STATUSES);
            favorites = profileRepository.favoriteItems(restaurant.getId(), phone, FAVORITES_LIMIT)
                    .stream()
                    .map(row -> new ReturningCustomerResponse.FavoriteItem(
                            ((Number) row[0]).longValue(),
                            (String) row[1],
                            (String) row[2],
                            ((Number) row[3]).longValue(),
                            ((Number) row[4]).longValue()))
                    .toList();
            lastOrder = orderRepository
                    .findFirstByRestaurantIdAndCustomerPhoneAndStatusNotInOrderByCreatedAtDesc(
                            restaurant.getId(), phone, EXCLUDED_STATUSES)
                    .map(o -> new ReturningCustomerResponse.LastOrder(
                            o.getCreatedAt(),
                            o.getItems().stream()
                                    .map(i -> new ReturningCustomerResponse.LastOrderItem(
                                            i.getMenuItemId(), i.getNameEnSnapshot(),
                                            i.getNameArSnapshot(), i.getQuantity()))
                                    .toList()))
                    .orElse(null);
        }

        return new ReturningCustomerResponse(
                profile.getCustomerName(), phone, profile.getCarPlate(), profile.getCarColor(),
                orderCount, favorites, lastOrder);
    }

    // ============================================================ dashboard

    @Transactional(readOnly = true)
    public List<BlockedPhoneResponse> listBlocked(Long restaurantId) {
        Long scope = resolveRestaurantScope(restaurantId);
        return blockedPhoneRepository.findByRestaurantIdOrderByCreatedAtDesc(scope)
                .stream().map(BlockedPhoneResponse::from).toList();
    }

    @Transactional
    public BlockedPhoneResponse block(Long restaurantId, String rawPhone, String reason) {
        Long scope = resolveRestaurantScope(restaurantId);
        String phone = Phones.normalize(rawPhone);
        if (phone == null) {
            throw new BadRequestException("A valid phone number is required");
        }
        if (blockedPhoneRepository.existsByRestaurantIdAndPhone(scope, phone)) {
            throw new ConflictException("This phone number is already blocked");
        }
        BlockedPhone blocked = new BlockedPhone();
        blocked.setRestaurantId(scope);
        blocked.setPhone(phone);
        blocked.setReason(reason);
        blocked.setBlockedBy(SecurityUtils.currentUser().getUsername());
        return BlockedPhoneResponse.from(blockedPhoneRepository.save(blocked));
    }

    @Transactional
    public void unblock(Long id) {
        BlockedPhone blocked = blockedPhoneRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Blocked phone", id));
        accessGuard.requireRestaurantAccess(blocked.getRestaurantId());
        blockedPhoneRepository.delete(blocked);
    }

    /** Tenant users are pinned to their restaurant; platform admin must say which one. */
    private Long resolveRestaurantScope(Long requestedRestaurantId) {
        Long scoped = accessGuard.scopedRestaurantId();
        if (scoped != null) {
            return scoped;
        }
        if (requestedRestaurantId == null) {
            throw new BadRequestException("Platform admin must specify a restaurantId");
        }
        return requestedRestaurantId;
    }
}
