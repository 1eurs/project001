package com.cafeqr.loyalty.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

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

    /**
     * The menu items eligible as the free reward — the customer picks ONE of them on redemption;
     * the discount equals that item's priced unit on the order.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "loyalty_reward_items", joinColumns = @JoinColumn(name = "program_id"))
    @Column(name = "menu_item_id", nullable = false)
    private Set<Long> rewardItemIds = new LinkedHashSet<>();

    /** Optional floor: an order must reach this total to earn a stamp. */
    @Column(name = "min_order_amount")
    private BigDecimal minOrderAmount;

    /** Card accent hex (e.g. #FF7AA2); null = inherit the café's menu-skin accent. */
    @Column(name = "card_color", length = 7)
    private String cardColor;

    /** Card background hex; null = the surrounding skin's surface color. */
    @Column(name = "card_bg", length = 7)
    private String cardBg;

    /** Emoji punched into earned stamps. */
    @Column(name = "stamp_icon", nullable = false, length = 8)
    private String stampIcon = "★";

    /** Subtle repeating watermark on the ticket (menu-theme motif key); null = none. */
    @Column(name = "card_motif", length = 12)
    private String cardMotif;

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getStampsRequired() { return stampsRequired; }
    public void setStampsRequired(int stampsRequired) { this.stampsRequired = stampsRequired; }

    public String getRewardLabel() { return rewardLabel; }
    public void setRewardLabel(String rewardLabel) { this.rewardLabel = rewardLabel; }

    public Set<Long> getRewardItemIds() { return rewardItemIds; }
    public void setRewardItemIds(Set<Long> rewardItemIds) { this.rewardItemIds = rewardItemIds; }

    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(BigDecimal minOrderAmount) { this.minOrderAmount = minOrderAmount; }

    public String getCardColor() { return cardColor; }
    public void setCardColor(String cardColor) { this.cardColor = cardColor; }

    public String getCardBg() { return cardBg; }
    public void setCardBg(String cardBg) { this.cardBg = cardBg; }

    public String getStampIcon() { return stampIcon; }
    public void setStampIcon(String stampIcon) { this.stampIcon = stampIcon; }

    public String getCardMotif() { return cardMotif; }
    public void setCardMotif(String cardMotif) { this.cardMotif = cardMotif; }
}
