package com.cafeqr.loyalty.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** A café's stamp-card configuration. Exactly one row per restaurant. */
@Entity
@Table(name = "loyalty_programs")
public class LoyaltyProgram extends BaseEntity {

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;

    @Column(name = "stamps_required", nullable = false)
    private int stampsRequired = 8;

    @Column(name = "reward_label", nullable = false, length = 120)
    private String rewardLabel;

    /** The free menu item; the redemption discount equals its priced unit on the order. */
    @Column(name = "reward_item_id")
    private Long rewardItemId;

    /** Optional floor: an order must reach this total to earn a stamp. */
    @Column(name = "min_order_amount")
    private BigDecimal minOrderAmount;

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getStampsRequired() { return stampsRequired; }
    public void setStampsRequired(int stampsRequired) { this.stampsRequired = stampsRequired; }

    public String getRewardLabel() { return rewardLabel; }
    public void setRewardLabel(String rewardLabel) { this.rewardLabel = rewardLabel; }

    public Long getRewardItemId() { return rewardItemId; }
    public void setRewardItemId(Long rewardItemId) { this.rewardItemId = rewardItemId; }

    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(BigDecimal minOrderAmount) { this.minOrderAmount = minOrderAmount; }
}
