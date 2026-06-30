ALTER TABLE restaurants
    ADD COLUMN payment_method_selection_enabled BOOLEAN NOT NULL DEFAULT FALSE;
