-- Takeaway is being retired as an order type; the product keeps only DINE_IN and CAR.
-- Existing takeaway orders fold into CAR (outdoor/pickup) so historical rows still
-- deserialize against the trimmed OrderType enum (mapped @Enumerated(STRING)).
UPDATE orders SET order_type = 'CAR' WHERE order_type = 'TAKEAWAY';
