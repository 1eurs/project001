package com.cafeqr.loyalty.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * A customer's stamp balance at one café, keyed by normalized phone. The counters are the
 * operational source of truth (mutated under a row lock); {@link LoyaltyTransaction} is the
 * audit log. The cross-café portal aggregates a customer's rows by phone.
 */
@Entity
@Table(name = "loyalty_members",
        uniqueConstraints = @UniqueConstraint(name = "uq_loyalty_member",
                columnNames = {"restaurant_id", "phone"}))
public class LoyaltyMember extends BaseEntity {

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "phone", nullable = false, length = 40)
    private String phone;

    @Column(name = "name", length = 150)
    private String name;

    /** Progress toward the current card (0 .. stampsRequired - 1). */
    @Column(name = "stamps", nullable = false)
    private int stamps = 0;

    /** Completed cards not yet redeemed (a reserved redemption decrements this). */
    @Column(name = "available_rewards", nullable = false)
    private int availableRewards = 0;

    @Column(name = "lifetime_stamps", nullable = false)
    private int lifetimeStamps = 0;

    @Column(name = "rewards_redeemed", nullable = false)
    private int rewardsRedeemed = 0;

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getStamps() { return stamps; }
    public void setStamps(int stamps) { this.stamps = stamps; }

    public int getAvailableRewards() { return availableRewards; }
    public void setAvailableRewards(int availableRewards) { this.availableRewards = availableRewards; }

    public int getLifetimeStamps() { return lifetimeStamps; }
    public void setLifetimeStamps(int lifetimeStamps) { this.lifetimeStamps = lifetimeStamps; }

    public int getRewardsRedeemed() { return rewardsRedeemed; }
    public void setRewardsRedeemed(int rewardsRedeemed) { this.rewardsRedeemed = rewardsRedeemed; }
}
