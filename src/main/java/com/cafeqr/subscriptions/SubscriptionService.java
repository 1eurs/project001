package com.cafeqr.subscriptions;

import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.subscriptions.domain.BillingCycle;
import com.cafeqr.subscriptions.domain.Subscription;
import com.cafeqr.subscriptions.domain.SubscriptionStatus;
import com.cafeqr.subscriptions.dto.CreateSubscriptionRequest;
import com.cafeqr.subscriptions.dto.SubscriptionResponse;
import com.cafeqr.subscriptions.dto.UpdateSubscriptionRequest;
import com.cafeqr.subscriptions.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final RestaurantService restaurantService;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               RestaurantService restaurantService) {
        this.subscriptionRepository = subscriptionRepository;
        this.restaurantService = restaurantService;
    }

    @Transactional
    public SubscriptionResponse create(Long restaurantId, CreateSubscriptionRequest request) {
        restaurantService.getEntity(restaurantId); // ensure exists

        Subscription subscription = new Subscription();
        subscription.setRestaurantId(restaurantId);
        subscription.setPlanName(request.planName());
        subscription.setBillingCycle(request.billingCycle());
        subscription.setPrice(request.price());
        subscription.setStatus(request.status() != null ? request.status() : defaultStatus(request.billingCycle()));
        subscription.setStartDate(request.startDate() != null ? request.startDate() : LocalDate.now());
        subscription.setEndDate(request.billingCycle() == BillingCycle.ONE_TIME ? null : request.endDate());
        return SubscriptionResponse.from(subscriptionRepository.save(subscription));
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getForRestaurant(Long restaurantId) {
        return subscriptionRepository.findFirstByRestaurantIdOrderByIdDesc(restaurantId)
                .map(SubscriptionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No subscription found for restaurant " + restaurantId));
    }

    @Transactional
    public SubscriptionResponse update(Long id, UpdateSubscriptionRequest request) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Subscription", id));
        if (request.planName() != null) {
            subscription.setPlanName(request.planName());
        }
        BillingCycle cycle = request.billingCycle() != null ? request.billingCycle() : subscription.getBillingCycle();
        if (request.billingCycle() != null) {
            subscription.setBillingCycle(cycle);
        }
        if (request.price() != null) {
            subscription.setPrice(request.price());
        }
        if (request.status() != null) {
            subscription.setStatus(request.status());
        }
        if (request.startDate() != null) {
            subscription.setStartDate(request.startDate());
        }
        if (cycle == BillingCycle.ONE_TIME) {
            subscription.setEndDate(null);
            subscription.setLastReminderOn(null);
        } else if (request.endDate() != null) {
            subscription.setEndDate(request.endDate());
        }
        return SubscriptionResponse.from(subscription);
    }

    /** A one-off payment is active immediately once recorded; recurring plans start as a trial. */
    private SubscriptionStatus defaultStatus(BillingCycle cycle) {
        return cycle == BillingCycle.ONE_TIME ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL;
    }
}
