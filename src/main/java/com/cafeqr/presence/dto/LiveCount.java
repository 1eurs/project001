package com.cafeqr.presence.dto;

/**
 * Live presence on one QR: how many customers are on the menu and how many of those are actively
 * ordering (cart has items / at checkout). {@code present} includes {@code ordering}.
 */
public record LiveCount(int present, int ordering) {}
