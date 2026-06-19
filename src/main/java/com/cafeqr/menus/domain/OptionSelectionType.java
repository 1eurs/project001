package com.cafeqr.menus.domain;

/**
 * How a customer picks from an option group.
 * <ul>
 *   <li>{@code SINGLE} — pick exactly one (e.g. Size: Small / Medium / Large).
 *       {@code required} on the group forces a non-empty choice.</li>
 *   <li>{@code MULTI} — pick any number, including zero (e.g. Extras: Whipped cream,
 *       Extra shot). {@code required} is ignored for MULTI groups.</li>
 * </ul>
 */
public enum OptionSelectionType {
    SINGLE,
    MULTI
}