-- =====================================================================
-- Cafes pay the platform either once (ONE_TIME) or recurring (MONTHLY/YEARLY).
-- Generalize `monthly_price` to a per-cycle `price` and add the billing cycle.
-- =====================================================================
ALTER TABLE subscriptions RENAME COLUMN monthly_price TO price;
ALTER TABLE subscriptions ADD COLUMN billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY';
