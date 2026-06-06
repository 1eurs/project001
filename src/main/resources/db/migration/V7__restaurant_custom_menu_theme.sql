-- Optional JSON payload for a cafe owner's custom public-menu colors.
ALTER TABLE restaurants
    ADD COLUMN menu_theme_custom_json TEXT;
