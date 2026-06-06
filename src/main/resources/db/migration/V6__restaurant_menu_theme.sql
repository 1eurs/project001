-- Menu skin selected by the cafe owner for the public customer menu.
ALTER TABLE restaurants
    ADD COLUMN menu_theme VARCHAR(40) NOT NULL DEFAULT 'onyx';
