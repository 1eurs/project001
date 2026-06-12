package com.cafeqr.customers.repository;

import com.cafeqr.customers.domain.BlockedPhone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlockedPhoneRepository extends JpaRepository<BlockedPhone, Long> {

    boolean existsByRestaurantIdAndPhone(Long restaurantId, String phone);

    List<BlockedPhone> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
}
