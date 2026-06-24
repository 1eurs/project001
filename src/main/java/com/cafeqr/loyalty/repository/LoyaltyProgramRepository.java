package com.cafeqr.loyalty.repository;

import com.cafeqr.loyalty.domain.LoyaltyProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoyaltyProgramRepository extends JpaRepository<LoyaltyProgram, Long> {
    Optional<LoyaltyProgram> findByRestaurantId(Long restaurantId);
}
