-- =====================================================================
-- Append-only event logs for analytics.
--
-- order_events: one row per order lifecycle transition (created, accepted,
-- declined, preparing, ready, completed, cancelled) with the acting staff
-- user id — the missing "who did it" signal. Lets us rebuild any order's
-- full timeline and measure per-staff throughput / acceptance latency.
--
-- analytics_events: customer-side funnel events from the public menu
-- (menu_view, add_to_cart, remove_from_cart, checkout_started, …) keyed by
-- the same device_token used by customer_profiles. Captures the QR-first
-- funnel that PresenceService was throwing away after 45s.
--
-- Both tables are write-once (no updated_at). Payload columns are TEXT
-- holding JSON; native analytics queries can cast to jsonb when needed.
-- =====================================================================

CREATE TABLE order_events (
    id             BIGSERIAL    PRIMARY KEY,
    order_id       BIGINT       NOT NULL REFERENCES orders (id),
    restaurant_id  BIGINT       NOT NULL REFERENCES restaurants (id),
    branch_id      BIGINT       NOT NULL REFERENCES branches (id),
    event_type     VARCHAR(40)  NOT NULL,
    actor_user_id  BIGINT       REFERENCES users (id),
    actor_name     VARCHAR(150),
    note           VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_order_events_order_id       ON order_events (order_id, created_at);
CREATE INDEX ix_order_events_restaurant_id  ON order_events (restaurant_id, created_at);
CREATE INDEX ix_order_events_actor_user_id  ON order_events (actor_user_id, created_at)
    WHERE actor_user_id IS NOT NULL;

CREATE TABLE analytics_events (
    id             BIGSERIAL    PRIMARY KEY,
    restaurant_id  BIGINT       NOT NULL REFERENCES restaurants (id),
    branch_id      BIGINT       REFERENCES branches (id),
    device_token   VARCHAR(64),
    session_token  VARCHAR(64),
    qr_table_id    BIGINT       REFERENCES restaurant_tables (id),
    event_type     VARCHAR(40)  NOT NULL,
    menu_item_id   BIGINT,
    quantity       INT,
    payload        TEXT,
    created_at     TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_analytics_events_restaurant_id ON analytics_events (restaurant_id, created_at);
CREATE INDEX ix_analytics_events_event_type    ON analytics_events (event_type, created_at);
CREATE INDEX ix_analytics_events_device_token  ON analytics_events (restaurant_id, device_token, created_at)
    WHERE device_token IS NOT NULL;