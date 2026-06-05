-- =====================================================================
-- Record how a payment was taken (cash / card at the cafe, or online).
-- Online payment is optional; most orders are settled in person.
-- =====================================================================
ALTER TABLE payments ADD COLUMN method VARCHAR(20);
