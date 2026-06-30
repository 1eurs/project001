ALTER TABLE analytics_events
    DROP CONSTRAINT IF EXISTS analytics_events_qr_table_id_fkey;

ALTER TABLE analytics_events
    ADD CONSTRAINT analytics_events_qr_table_id_fkey
        FOREIGN KEY (qr_table_id)
        REFERENCES restaurant_tables (id)
        ON DELETE SET NULL;
