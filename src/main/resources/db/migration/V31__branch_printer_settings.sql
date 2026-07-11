-- Per-branch toggle for auto-printing a receipt (via RawBT on the branch's Android tablet)
-- when an order is marked complete. The printer pairing itself lives inside RawBT, not here.
ALTER TABLE branches ADD COLUMN printer_enabled BOOLEAN NOT NULL DEFAULT FALSE;
