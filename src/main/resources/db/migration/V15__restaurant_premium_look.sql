-- Premium menu-look entitlement. Off by default; a platform admin flips it on for a
-- café that pays for the "Pro look" tier (advanced structural kits, occasion decor,
-- theme JSON import). The public menu renders whatever theme is saved regardless — this
-- flag only unlocks the advanced editor controls in the owner dashboard.
ALTER TABLE restaurants
    ADD COLUMN premium_look BOOLEAN NOT NULL DEFAULT false;
