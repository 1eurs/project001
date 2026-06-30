package com.cafeqr.loyalty.repository;

import com.cafeqr.loyalty.domain.LoyaltyMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

    /**
     * Create the member row only if one doesn't already exist, atomically. Lets concurrent order
     * completions for a brand-new phone race safely: the loser's INSERT is a no-op (ON CONFLICT)
     * rather than a uq_loyalty_member violation, so a following {@link #lockByRestaurantIdAndPhone}
     * always finds the row.
     */
    @Modifying
    @Query(value = """
            INSERT INTO loyalty_members
                (restaurant_id, phone, name, stamps, available_rewards, lifetime_stamps, rewards_redeemed, created_at, updated_at)
            VALUES (:restaurantId, :phone, :name, 0, 0, 0, 0, now(), now())
            ON CONFLICT (restaurant_id, phone) DO NOTHING
            """, nativeQuery = true)
    void insertIfAbsent(@Param("restaurantId") Long restaurantId,
                        @Param("phone") String phone,
                        @Param("name") String name);

    /** Every membership for a phone — powers the cross-café customer portal. */
    List<LoyaltyMember> findByPhoneOrderByUpdatedAtDesc(String phone);

    /** Dashboard members list for one café (most recently active first). */
    List<LoyaltyMember> findTop200ByRestaurantIdOrderByUpdatedAtDesc(Long restaurantId);
}
