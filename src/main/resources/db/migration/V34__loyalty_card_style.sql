-- Loyalty card studio: each café styles its own stamp card. The style renders on
-- the customer's card (track page, cross-café portal) and tints the loyalty strips.
ALTER TABLE loyalty_programs
    -- accent hex (e.g. #FF7AA2); NULL = inherit the café's menu-skin accent.
    ADD COLUMN card_color VARCHAR(7),
    -- emoji punched into earned stamps.
    ADD COLUMN stamp_icon VARCHAR(8) NOT NULL DEFAULT '★',
    -- subtle repeating watermark on the ticket (menu-theme motif key); NULL = none.
    ADD COLUMN card_motif VARCHAR(12);
