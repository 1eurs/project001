-- Card studio: optional card background color. NULL = the card keeps the
-- surface color of whatever skin it renders inside (menu theme / portal).
ALTER TABLE loyalty_programs
    ADD COLUMN card_bg VARCHAR(7);
