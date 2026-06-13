ALTER TABLE order_items
    ALTER COLUMN menu_item_id DROP NOT NULL;

ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS fk_order_items_menu_item_id;

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_menu_item_id
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items (id)
        ON DELETE SET NULL;
