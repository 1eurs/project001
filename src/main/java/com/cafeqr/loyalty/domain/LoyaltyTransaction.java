package com.cafeqr.loyalty.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Append-only ledger of loyalty effects on orders. UNIQUE(order_id, type) makes earning and
 * redeeming idempotent (at most one EARN and one REDEEM per order). A REDEEM row also tracks
 * the redemption's PENDING -> CONFIRMED/VOID state.
 */
@Entity
@Table(name = "loyalty_transactions",
        uniqueConstraints = @UniqueConstraint(name = "uq_loyalty_txn_order_type",
                columnNames = {"order_id", "type"}))
public class LoyaltyTransaction extends BaseEntity {

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "phone", nullable = false, length = 40)
    private String phone;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private LoyaltyTxnType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LoyaltyTxnStatus status;

    @Column(name = "stamps_delta", nullable = false)
    private int stampsDelta;

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public LoyaltyTxnType getType() { return type; }
    public void setType(LoyaltyTxnType type) { this.type = type; }

    public LoyaltyTxnStatus getStatus() { return status; }
    public void setStatus(LoyaltyTxnStatus status) { this.status = status; }

    public int getStampsDelta() { return stampsDelta; }
    public void setStampsDelta(int stampsDelta) { this.stampsDelta = stampsDelta; }
}
