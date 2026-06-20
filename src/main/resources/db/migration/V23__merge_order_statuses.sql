-- =====================================================================
-- Simplify the order lifecycle: merge ACCEPTED + PREPARING into one
-- "in progress" step (kept as ACCEPTED), and merge DECLINED into CANCELLED.
-- The OrderStatus enum keeps the old values for safety, but they are no
-- longer produced; convert existing rows so the data matches the new model.
-- =====================================================================
UPDATE orders
   SET status = 'ACCEPTED',
       accepted_at = COALESCE(accepted_at, preparing_at)
 WHERE status = 'PREPARING';

UPDATE orders
   SET status = 'CANCELLED',
       cancelled_at = COALESCE(cancelled_at, declined_at)
 WHERE status = 'DECLINED';
