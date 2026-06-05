package com.cafeqr.subscriptions.repository;

import com.cafeqr.subscriptions.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findFirstByRestaurantIdOrderByIdDesc(Long restaurantId);
}
