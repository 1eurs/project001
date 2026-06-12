package com.cafeqr.customers.domain;

import com.cafeqr.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * What a returning customer last told us, per (restaurant, device). The device token is a
 * browser-generated random UUID and acts as the read credential — profiles are never
 * looked up by phone from public endpoints, so one customer cannot pull another's data.
 */
@Entity
@Table(name = "customer_profiles")
public class CustomerProfile extends BaseEntity {

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "device_token", nullable = false, length = 64)
    private String deviceToken;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 40)
    private String customerPhone;

    @Column(name = "car_plate", length = 40)
    private String carPlate;

    @Column(name = "car_color", length = 20)
    private String carColor;

    @Column(name = "order_count", nullable = false)
    private int orderCount;

    @Column(name = "last_order_at")
    private Instant lastOrderAt;

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getDeviceToken() {
        return deviceToken;
    }

    public void setDeviceToken(String deviceToken) {
        this.deviceToken = deviceToken;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCarPlate() {
        return carPlate;
    }

    public void setCarPlate(String carPlate) {
        this.carPlate = carPlate;
    }

    public String getCarColor() {
        return carColor;
    }

    public void setCarColor(String carColor) {
        this.carColor = carColor;
    }

    public int getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(int orderCount) {
        this.orderCount = orderCount;
    }

    public Instant getLastOrderAt() {
        return lastOrderAt;
    }

    public void setLastOrderAt(Instant lastOrderAt) {
        this.lastOrderAt = lastOrderAt;
    }
}
