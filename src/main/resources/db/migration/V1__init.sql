-- =====================================================================
-- CafeQR :: initial schema
-- Multi-tenant QR ordering platform for small cafes (Oman / OMR)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Restaurants (tenant root)
-- ---------------------------------------------------------------------
CREATE TABLE restaurants (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(150)  NOT NULL,
    slug          VARCHAR(150)  NOT NULL,
    logo_url      VARCHAR(500),
    phone         VARCHAR(40),
    email         VARCHAR(150),
    instagram_url VARCHAR(300),
    currency      VARCHAR(3)    NOT NULL DEFAULT 'OMR',
    vat_enabled   BOOLEAN       NOT NULL DEFAULT TRUE,
    vat_rate      NUMERIC(5,2)  NOT NULL DEFAULT 5,
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL,
    updated_at    TIMESTAMPTZ   NOT NULL
);
CREATE UNIQUE INDEX ux_restaurants_slug ON restaurants (slug);

-- ---------------------------------------------------------------------
-- Branches
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT       NOT NULL REFERENCES restaurants (id),
    name          VARCHAR(150) NOT NULL,
    address       VARCHAR(300),
    phone         VARCHAR(40),
    opening_hours VARCHAR(500),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_branches_restaurant_id ON branches (restaurant_id);

-- ---------------------------------------------------------------------
-- Users (platform admin + restaurant/branch staff)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    phone         VARCHAR(40),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(40)  NOT NULL,
    restaurant_id BIGINT       REFERENCES restaurants (id),
    branch_id     BIGINT       REFERENCES branches (id),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email));
CREATE INDEX ix_users_restaurant_id ON users (restaurant_id);
CREATE INDEX ix_users_branch_id ON users (branch_id);

-- ---------------------------------------------------------------------
-- Refresh tokens
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL
);
CREATE UNIQUE INDEX ux_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ---------------------------------------------------------------------
-- Tables / QR codes
-- ---------------------------------------------------------------------
CREATE TABLE restaurant_tables (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT       NOT NULL REFERENCES restaurants (id),
    branch_id     BIGINT       NOT NULL REFERENCES branches (id),
    table_number  VARCHAR(40)  NOT NULL,
    qr_code_token VARCHAR(64)  NOT NULL,
    qr_code_url   VARCHAR(500),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE UNIQUE INDEX ux_tables_qr_code_token ON restaurant_tables (qr_code_token);
CREATE INDEX ix_tables_branch_id ON restaurant_tables (branch_id);
CREATE INDEX ix_tables_restaurant_id ON restaurant_tables (restaurant_id);

-- ---------------------------------------------------------------------
-- Menu categories
-- ---------------------------------------------------------------------
CREATE TABLE menu_categories (
    id             BIGSERIAL PRIMARY KEY,
    restaurant_id  BIGINT       NOT NULL REFERENCES restaurants (id),
    branch_id      BIGINT       REFERENCES branches (id),
    name_en        VARCHAR(150) NOT NULL,
    name_ar        VARCHAR(150) NOT NULL,
    description_en VARCHAR(500),
    description_ar VARCHAR(500),
    display_order  INT          NOT NULL DEFAULT 0,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_menu_categories_restaurant_id ON menu_categories (restaurant_id);
CREATE INDEX ix_menu_categories_branch_id ON menu_categories (branch_id);

-- ---------------------------------------------------------------------
-- Menu items
-- ---------------------------------------------------------------------
CREATE TABLE menu_items (
    id                      BIGSERIAL PRIMARY KEY,
    restaurant_id           BIGINT        NOT NULL REFERENCES restaurants (id),
    branch_id               BIGINT        REFERENCES branches (id),
    category_id             BIGINT        NOT NULL REFERENCES menu_categories (id),
    name_en                 VARCHAR(150)  NOT NULL,
    name_ar                 VARCHAR(150)  NOT NULL,
    description_en          VARCHAR(500),
    description_ar          VARCHAR(500),
    price                   NUMERIC(12,3) NOT NULL,
    image_url               VARCHAR(500),
    available               BOOLEAN       NOT NULL DEFAULT TRUE,
    preparation_time_minutes INT,
    display_order           INT           NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ   NOT NULL,
    updated_at              TIMESTAMPTZ   NOT NULL
);
CREATE INDEX ix_menu_items_category_id ON menu_items (category_id);
CREATE INDEX ix_menu_items_restaurant_id ON menu_items (restaurant_id);
CREATE INDEX ix_menu_items_branch_id ON menu_items (branch_id);

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
CREATE SEQUENCE order_number_seq START 1000 INCREMENT 1;

CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    order_number    VARCHAR(40)   NOT NULL,
    tracking_token  VARCHAR(64)   NOT NULL,
    restaurant_id   BIGINT        NOT NULL REFERENCES restaurants (id),
    branch_id       BIGINT        NOT NULL REFERENCES branches (id),
    table_id        BIGINT        REFERENCES restaurant_tables (id),
    customer_name   VARCHAR(150),
    customer_phone  VARCHAR(40),
    order_type      VARCHAR(20)   NOT NULL,
    status          VARCHAR(20)   NOT NULL,
    payment_status  VARCHAR(20)   NOT NULL,
    subtotal        NUMERIC(12,3) NOT NULL,
    vat_amount      NUMERIC(12,3) NOT NULL,
    total           NUMERIC(12,3) NOT NULL,
    prep_time_minutes INT,
    decline_reason  VARCHAR(300),
    customer_note   VARCHAR(500),
    internal_note   VARCHAR(500),
    created_at      TIMESTAMPTZ   NOT NULL,
    accepted_at     TIMESTAMPTZ,
    declined_at     TIMESTAMPTZ,
    preparing_at    TIMESTAMPTZ,
    ready_at        TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ   NOT NULL
);
CREATE UNIQUE INDEX ux_orders_order_number ON orders (order_number);
CREATE UNIQUE INDEX ux_orders_tracking_token ON orders (tracking_token);
CREATE INDEX ix_orders_restaurant_id ON orders (restaurant_id);
CREATE INDEX ix_orders_branch_id ON orders (branch_id);
CREATE INDEX ix_orders_status ON orders (status);
CREATE INDEX ix_orders_created_at ON orders (created_at);

-- ---------------------------------------------------------------------
-- Order items (with name/price snapshots)
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    menu_item_id     BIGINT        NOT NULL REFERENCES menu_items (id),
    name_en_snapshot VARCHAR(150)  NOT NULL,
    name_ar_snapshot VARCHAR(150)  NOT NULL,
    price_snapshot   NUMERIC(12,3) NOT NULL,
    quantity         INT           NOT NULL,
    note             VARCHAR(300),
    line_total       NUMERIC(12,3) NOT NULL
);
CREATE INDEX ix_order_items_order_id ON order_items (order_id);
CREATE INDEX ix_order_items_menu_item_id ON order_items (menu_item_id);

-- ---------------------------------------------------------------------
-- Payments (stub provider; real gateway later)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT        NOT NULL REFERENCES orders (id),
    provider            VARCHAR(40)   NOT NULL,
    provider_payment_id VARCHAR(150),
    amount              NUMERIC(12,3) NOT NULL,
    currency            VARCHAR(3)    NOT NULL,
    status              VARCHAR(20)   NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL,
    updated_at          TIMESTAMPTZ   NOT NULL
);
CREATE INDEX ix_payments_order_id ON payments (order_id);

-- ---------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------
CREATE TABLE subscriptions (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT        NOT NULL REFERENCES restaurants (id),
    plan_name     VARCHAR(80)   NOT NULL,
    monthly_price NUMERIC(12,3) NOT NULL,
    status        VARCHAR(20)   NOT NULL,
    start_date    DATE          NOT NULL,
    end_date      DATE,
    created_at    TIMESTAMPTZ   NOT NULL,
    updated_at    TIMESTAMPTZ   NOT NULL
);
CREATE INDEX ix_subscriptions_restaurant_id ON subscriptions (restaurant_id);
