-- =====================================================================
-- Loyalty (stamp-card) system.
--
-- A café configures one stamp-card program (loyalty_programs). Customers
-- collect a stamp per qualifying order; after `stamps_required` stamps a
-- reward (a free menu item) becomes available and can be redeemed at
-- checkout. Progress is tracked per (restaurant, normalized phone) in
-- loyalty_members; the customer's cross-café portal aggregates these rows
-- by phone. loyalty_transactions is an append-only ledger that makes
-- earning / redeeming idempotent per order (UNIQUE(order_id, type)) and
-- auditable; it also holds a redemption's PENDING -> CONFIRMED/VOID state.
--
-- Gating: configuring a program is a PRO-tier feature (enforced in the
-- service layer via Entitlements.requirePro), so the tables carry no plan
-- column of their own.
-- =====================================================================

CREATE TABLE loyalty_programs (
    id                BIGSERIAL     PRIMARY KEY,
    restaurant_id     BIGINT        NOT NULL UNIQUE REFERENCES restaurants (id),
    enabled           BOOLEAN       NOT NULL DEFAULT FALSE,
    stamps_required   INT           NOT NULL DEFAULT 8,
    reward_label      VARCHAR(120)  NOT NULL,
    -- the free item; the redemption discount equals its priced unit on the order.
    reward_item_id    BIGINT        REFERENCES menu_items (id) ON DELETE SET NULL,
    -- optional anti-gaming floor: an order must reach this total to earn a stamp.
    min_order_amount  NUMERIC(12,3),
    created_at        TIMESTAMPTZ   NOT NULL,
    updated_at        TIMESTAMPTZ   NOT NULL
);

CREATE TABLE loyalty_members (
    id                 BIGSERIAL     PRIMARY KEY,
    restaurant_id      BIGINT        NOT NULL REFERENCES restaurants (id),
    phone              VARCHAR(40)   NOT NULL,
    name               VARCHAR(150),
    -- progress toward the current card (0 .. stamps_required - 1)
    stamps             INT           NOT NULL DEFAULT 0,
    -- completed cards not yet redeemed (a reserved redemption decrements this)
    available_rewards  INT           NOT NULL DEFAULT 0,
    lifetime_stamps    INT           NOT NULL DEFAULT 0,
    rewards_redeemed   INT           NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ   NOT NULL,
    updated_at         TIMESTAMPTZ   NOT NULL,
    CONSTRAINT uq_loyalty_member UNIQUE (restaurant_id, phone)
);

-- The cross-café portal looks up every membership for a verified phone.
CREATE INDEX ix_loyalty_members_phone ON loyalty_members (phone);

CREATE TABLE loyalty_transactions (
    id             BIGSERIAL    PRIMARY KEY,
    restaurant_id  BIGINT       NOT NULL REFERENCES restaurants (id),
    phone          VARCHAR(40)  NOT NULL,
    order_id       BIGINT       NOT NULL REFERENCES orders (id),
    type           VARCHAR(20)  NOT NULL,   -- EARN | REDEEM
    status         VARCHAR(20)  NOT NULL,   -- CONFIRMED | PENDING | VOID
    stamps_delta   INT          NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL,
    -- at most one EARN and one REDEEM per order -> idempotent loyalty effects.
    CONSTRAINT uq_loyalty_txn_order_type UNIQUE (order_id, type)
);

CREATE INDEX ix_loyalty_txn_restaurant_phone ON loyalty_transactions (restaurant_id, phone);

-- Snapshot of a redeemed reward on the order it was applied to, so staff see
-- the reward on the ticket and the stored total already reflects the discount.
ALTER TABLE orders
    ADD COLUMN loyalty_reward_label    VARCHAR(120),
    ADD COLUMN loyalty_reward_discount NUMERIC(12,3);
