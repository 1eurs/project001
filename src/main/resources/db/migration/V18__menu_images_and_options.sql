-- =====================================================================
-- Menu item galleries + flexible option groups.
--
-- menu_item_images: one item → many photos (slider in the customer detail
-- view). The first image (display_order = 0) is also written back to
-- menu_items.image_url so the existing grid thumbnail keeps working.
--
-- menu_item_option_groups: a group of choices for an item. selection_type
--   SINGLE = pick exactly one (e.g. Size: Small / Medium / Large)
--   MULTI  = pick any number (e.g. Milk: Oat, Coconut, Almond; Extras: …)
-- `required` only applies to SINGLE groups (a MULTI group is optional by
-- nature — you can pick zero). Multi-valued options can be capped by the
-- frontend later if needed; the schema doesn't enforce a max.
--
-- menu_item_options: the choices within a group, each with a price_delta
-- (can be negative for a discount, zero for a free swap). The price the
-- customer pays is base price + sum of chosen option deltas.
--
-- order_items.selected_options_json: a snapshot of the choices the customer
-- made for that line, so historical orders stay accurate when the cafe later
-- edits or deletes an option group. Stored as a JSON array text.
-- =====================================================================

CREATE TABLE menu_item_images (
    id            BIGSERIAL    PRIMARY KEY,
    menu_item_id  BIGINT       NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
    url           VARCHAR(500) NOT NULL,
    display_order INT          NOT NULL DEFAULT 0
);
CREATE INDEX ix_menu_item_images_item ON menu_item_images (menu_item_id, display_order);

CREATE TABLE menu_item_option_groups (
    id            BIGSERIAL    PRIMARY KEY,
    menu_item_id  BIGINT       NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
    name_en       VARCHAR(150) NOT NULL,
    name_ar       VARCHAR(150) NOT NULL,
    selection_type VARCHAR(20) NOT NULL,   -- SINGLE | MULTI
    required      BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_menu_option_groups_item ON menu_item_option_groups (menu_item_id, display_order);

CREATE TABLE menu_item_options (
    id            BIGSERIAL    PRIMARY KEY,
    option_group_id BIGINT     NOT NULL REFERENCES menu_item_option_groups (id) ON DELETE CASCADE,
    name_en       VARCHAR(150) NOT NULL,
    name_ar       VARCHAR(150) NOT NULL,
    price_delta   NUMERIC(12,3) NOT NULL DEFAULT 0,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ix_menu_options_group ON menu_item_options (option_group_id, display_order);

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS selected_options_json TEXT;