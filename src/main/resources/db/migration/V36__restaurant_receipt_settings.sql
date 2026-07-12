-- Per-café receipt customization (style preset, logo on/off, footer text, VAT/CR numbers)
-- as a free-form JSON document, mirroring menu_theme_custom_json. NULL = default receipt.
ALTER TABLE restaurants ADD COLUMN receipt_settings_json TEXT;
