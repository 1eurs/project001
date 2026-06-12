package com.cafeqr.customers.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** A phone number a restaurant no longer accepts orders from (fake orders / spam). */
@Entity
@Table(name = "blocked_phones")
public class BlockedPhone extends BaseEntity {

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    /** Normalized via {@link com.cafeqr.common.util.Phones#normalize}. */
    @Column(name = "phone", nullable = false, length = 40)
    private String phone;

    @Column(name = "reason", length = 300)
    private String reason;

    @Column(name = "blocked_by", length = 150)
    private String blockedBy;

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getBlockedBy() {
        return blockedBy;
    }

    public void setBlockedBy(String blockedBy) {
        this.blockedBy = blockedBy;
    }
}
