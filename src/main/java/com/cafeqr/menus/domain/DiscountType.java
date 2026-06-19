package com.cafeqr.menus.domain;

/**
 * How a menu item's discount is expressed.
 *
 * <ul>
 *   <li>{@link #PERCENT} — {@code discountValue} is the percent off the base price (0 &lt; v &lt; 100).</li>
 *   <li>{@link #FIXED} — {@code discountValue} is the new absolute sale price (0 &lt; v &lt; base price).</li>
 * </ul>
 */
public enum DiscountType {
    PERCENT,
    FIXED
}
