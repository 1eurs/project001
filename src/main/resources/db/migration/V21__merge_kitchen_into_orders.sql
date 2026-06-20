-- =====================================================================
-- Merge the KITCHEN permission into ORDERS. In practice a café's order
-- screen and kitchen screen are the same job, so the split only caused
-- confusion. Anyone who had KITCHEN now gets ORDERS; the KITCHEN rows go.
-- (ON CONFLICT covers staff who already held both.)
-- =====================================================================
INSERT INTO user_permissions (user_id, permission)
    SELECT user_id, 'ORDERS' FROM user_permissions WHERE permission = 'KITCHEN'
    ON CONFLICT DO NOTHING;

DELETE FROM user_permissions WHERE permission = 'KITCHEN';
