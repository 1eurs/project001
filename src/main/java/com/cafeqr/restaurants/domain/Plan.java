package com.cafeqr.restaurants.domain;

/**
 * Pricing tier for a café.
 * <ul>
 *   <li>{@code STANDARD} — core dashboard (today's counts, revenue, AOV, best-sellers, last 7 days).</li>
 *   <li>{@code PRO} — unlocks the insights layer built on the event tables: funnel, staff
 *       performance, forecast, churn watch, benchmarking, and the weekly insights email.</li>
 *   <li>{@code ENTERPRISE} — reserved (future tier for multi-branch groups / SLAs).
 *       Currently behaves like PRO; gate logic treats it as Pro-or-above.</li>
 * </ul>
 * The platform starts with two live tiers (STANDARD, PRO). ENTERPRISE is stubbed
 * so future pricing doesn't require another migration or enum rename.
 */
public enum Plan {
    STANDARD,
    PRO,
    ENTERPRISE
}