-- =====================================================================
-- Per-item discounts.
--
-- A menu item can carry an optional discount:
--   discount_type = PERCENT -> discount_value is the percent off (0 < v < 100)
--   discount_type = FIXED   -> discount_value is the new sale price (0 < v < price)
--   discount_type = NULL    -> no discount
--
-- discount_starts_at / discount_ends_at bound the active window (either may be
-- NULL for an open-ended bound). The discount applies to the base price only;
-- chosen option price_deltas still stack on top of the effective base. The
-- effective price is computed server-side at order time so it is never trusted
-- from the client.
-- =====================================================================

ALTER TABLE menu_items
    ADD COLUMN discount_type      VARCHAR(16),
    ADD COLUMN discount_value     NUMERIC(12,3),
    ADD COLUMN discount_starts_at TIMESTAMPTZ,
    ADD COLUMN discount_ends_at   TIMESTAMPTZ;
