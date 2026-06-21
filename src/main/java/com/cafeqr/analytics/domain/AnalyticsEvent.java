package com.cafeqr.analytics.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One row per customer action on the public menu. Append-only. {@code payload}
 * holds a JSON string of free-form extras (cart snapshot, referrer, …) — native
 * analytics queries cast it to jsonb when they need to drill in.
 */
@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "device_token", length = 64)
    private String deviceToken;

    @Column(name = "session_token", length = 64)
    private String sessionToken;

    @Column(name = "qr_table_id")
    private Long qrTableId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private AnalyticsEventType eventType;

    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "payload", columnDefinition = "text")
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getDeviceToken() {
        return deviceToken;
    }

    public void setDeviceToken(String deviceToken) {
        this.deviceToken = deviceToken;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public Long getQrTableId() {
        return qrTableId;
    }

    public void setQrTableId(Long qrTableId) {
        this.qrTableId = qrTableId;
    }

    public AnalyticsEventType getEventType() {
        return eventType;
    }

    public void setEventType(AnalyticsEventType eventType) {
        this.eventType = eventType;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}