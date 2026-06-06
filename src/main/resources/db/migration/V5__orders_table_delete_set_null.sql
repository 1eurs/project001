ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_table_id_fkey;

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS fk_orders_table_id;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_table_id
        FOREIGN KEY (table_id)
        REFERENCES restaurant_tables (id)
        ON DELETE SET NULL;
