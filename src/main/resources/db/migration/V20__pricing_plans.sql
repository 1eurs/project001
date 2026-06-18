-- =====================================================================
-- Platform pricing-plan catalogue, keyed to the café tier enum
-- (STANDARD / PRO / ENTERPRISE). A platform admin edits the price + setup
-- fee from the admin "Plans" page; feature-gating stays driven by the
-- café's tier (see Entitlements / Plan).
--
-- The three tiers are fixed rows — always present, never deleted. Seeded:
--   STANDARD   15 OMR/mo  — core dashboard
--   PRO        20 OMR/mo  — full analytics
--   ENTERPRISE custom     — reserved / SLA (price left NULL = "custom")
-- All carry a one-off 50 OMR setup fee.
-- =====================================================================
CREATE TABLE pricing_plans (
    id            BIGSERIAL      PRIMARY KEY,
    tier          VARCHAR(20)    NOT NULL UNIQUE,
    name          VARCHAR(80)    NOT NULL,
    monthly_price NUMERIC(10,3),
    setup_fee     NUMERIC(10,3)  NOT NULL DEFAULT 0,
    active        BOOLEAN        NOT NULL DEFAULT true,
    display_order INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ    NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL
);

INSERT INTO pricing_plans (tier, name, monthly_price, setup_fee, active, display_order, created_at, updated_at) VALUES
    ('STANDARD',   'Standard',   15.000, 50.000, true, 0, now(), now()),
    ('PRO',        'Pro',        20.000, 50.000, true, 1, now(), now()),
    ('ENTERPRISE', 'Enterprise', NULL,   50.000, true, 2, now(), now());
