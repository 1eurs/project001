package com.cafeqr.plans.domain;

import com.cafeqr.common.domain.BaseEntity;
import com.cafeqr.restaurants.domain.Plan;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * The pricing for one café tier (STANDARD / PRO / ENTERPRISE). There is exactly
 * one row per tier — they're fixed and always present; a platform admin edits the
 * price + setup fee from the Plans page. Feature-gating is driven by the tier
 * itself (see {@link com.cafeqr.analytics.Entitlements}); this row just carries
 * the money side and a display name.
 */
@Entity
@Table(name = "pricing_plans")
public class PricingPlan extends BaseEntity {

    /** The café tier this pricing applies to. Immutable identity of the row. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, unique = true, length = 20)
    private Plan tier;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    /** Recurring monthly price in OMR. NULL means "custom / contact us" (e.g. Enterprise). */
    @Column(name = "monthly_price", precision = 10, scale = 3)
    private BigDecimal monthlyPrice;

    /** One-off onboarding / setup fee charged on the first term, in OMR. */
    @Column(name = "setup_fee", nullable = false, precision = 10, scale = 3)
    private BigDecimal setupFee = BigDecimal.ZERO;

    /** Hidden tiers stay in the catalogue but aren't offered to new cafés. */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public Plan getTier() { return tier; }
    public void setTier(Plan tier) { this.tier = tier; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(BigDecimal monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public BigDecimal getSetupFee() { return setupFee; }
    public void setSetupFee(BigDecimal setupFee) { this.setupFee = setupFee; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
