package com.cafeqr.loyalty.repository;

import com.cafeqr.loyalty.domain.LoyaltyMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoyaltyMemberRepository extends JpaRepository<LoyaltyMember, Long> {

    /** Read-only lookup (cart/menu summary). */
    Optional<LoyaltyMember> findByRestaurantIdAndPhone(Long restaurantId, String phone);

    /** Locking lookup used on the order-flow mutation paths to avoid double-spend. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from LoyaltyMember m where m.restaurantId = :restaurantId and m.phone = :phone")
    Optional<LoyaltyMember> lockByRestaurantIdAndPhone(@Param("restaurantId") Long restaurantId,
                                                       @Param("phone") String phone);

    /** Every membership for a phone — powers the cross-café customer portal. */
    List<LoyaltyMember> findByPhoneOrderByUpdatedAtDesc(String phone);

    /** Dashboard members list for one café (most recently active first). */
    List<LoyaltyMember> findTop200ByRestaurantIdOrderByUpdatedAtDesc(Long restaurantId);
}
