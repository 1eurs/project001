-- How the order was paid (CASH/CARD/...), denormalized onto the order so order reads
-- (dashboard, printed receipts) don't need a join to the payments ledger. Kept in sync by
-- PaymentService.record(); the payments table remains the source of truth for history.
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20);

-- Backfill from each order's latest payment row.
UPDATE orders o
SET payment_method = p.method
FROM (
    SELECT DISTINCT ON (order_id) order_id, method
    FROM payments
    WHERE method IS NOT NULL
    ORDER BY order_id, id DESC
) p
WHERE p.order_id = o.id;
