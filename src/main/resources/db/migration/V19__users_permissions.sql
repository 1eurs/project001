-- ---------------------------------------------------------------------
-- Replace the fixed role hierarchy with username login + granular permissions.
--   * users gain a `username` (login id) and an `owner` flag (primary/billing account)
--   * email becomes optional (staff log in by username and need no email)
--   * per-area access lives in `user_permissions`
-- The old `role` column is backfilled into the new model, then dropped.
-- ---------------------------------------------------------------------

ALTER TABLE users ADD COLUMN username VARCHAR(60);
ALTER TABLE users ADD COLUMN owner    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE TABLE user_permissions (
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    permission VARCHAR(40) NOT NULL,
    CONSTRAINT pk_user_permissions PRIMARY KEY (user_id, permission),
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Backfill login + owner flag from the existing data.
UPDATE users SET username = LOWER(email);
UPDATE users SET owner = TRUE WHERE role = 'RESTAURANT_OWNER';

-- Backfill permissions from the old role. One INSERT per (role -> permission) pair.
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, p.permission
FROM users u
JOIN (
    VALUES
        -- Platform admin: everything.
        ('PLATFORM_ADMIN', 'PLATFORM_ADMIN'),
        ('PLATFORM_ADMIN', 'ORDERS'),
        ('PLATFORM_ADMIN', 'KITCHEN'),
        ('PLATFORM_ADMIN', 'PAYMENTS'),
        ('PLATFORM_ADMIN', 'MENU'),
        ('PLATFORM_ADMIN', 'QR_TABLES'),
        ('PLATFORM_ADMIN', 'TEAM'),
        ('PLATFORM_ADMIN', 'ANALYTICS'),
        ('PLATFORM_ADMIN', 'PROFILE'),
        ('PLATFORM_ADMIN', 'BRANCHES'),
        ('PLATFORM_ADMIN', 'BILLING'),
        -- Owner: full control of their restaurant (no platform access).
        ('RESTAURANT_OWNER', 'ORDERS'),
        ('RESTAURANT_OWNER', 'KITCHEN'),
        ('RESTAURANT_OWNER', 'PAYMENTS'),
        ('RESTAURANT_OWNER', 'MENU'),
        ('RESTAURANT_OWNER', 'QR_TABLES'),
        ('RESTAURANT_OWNER', 'TEAM'),
        ('RESTAURANT_OWNER', 'ANALYTICS'),
        ('RESTAURANT_OWNER', 'PROFILE'),
        ('RESTAURANT_OWNER', 'BRANCHES'),
        ('RESTAURANT_OWNER', 'BILLING'),
        -- Branch manager.
        ('BRANCH_MANAGER', 'ORDERS'),
        ('BRANCH_MANAGER', 'PAYMENTS'),
        ('BRANCH_MANAGER', 'MENU'),
        ('BRANCH_MANAGER', 'QR_TABLES'),
        ('BRANCH_MANAGER', 'TEAM'),
        ('BRANCH_MANAGER', 'ANALYTICS'),
        -- Cashier / staff.
        ('STAFF', 'ORDERS'),
        ('STAFF', 'PAYMENTS'),
        -- Kitchen.
        ('KITCHEN_STAFF', 'KITCHEN'),
        ('KITCHEN_STAFF', 'ORDERS')
) AS p(role, permission) ON p.role = u.role;

-- Lock down username now that every row has one, and drop the old role column.
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
DROP INDEX IF EXISTS ux_users_email;
CREATE UNIQUE INDEX ux_users_username ON users (LOWER(username));
CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email)) WHERE email IS NOT NULL;
ALTER TABLE users DROP COLUMN role;
