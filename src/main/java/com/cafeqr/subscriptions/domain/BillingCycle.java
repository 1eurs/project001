package com.cafeqr.subscriptions.domain;

/**
 * How a cafe pays the platform for CafeQR.
 * <ul>
 *   <li>{@link #ONE_TIME} – a single lifetime payment (no renewal; {@code endDate} usually null)</li>
 *   <li>{@link #MONTHLY} – recurring monthly</li>
 *   <li>{@link #YEARLY} – recurring yearly</li>
 * </ul>
 */
public enum BillingCycle {
    ONE_TIME,
    MONTHLY,
    YEARLY
}
