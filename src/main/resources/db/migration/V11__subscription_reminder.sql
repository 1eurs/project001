-- =====================================================================
-- Annual billing: track when a renewal reminder was last emailed, so the
-- daily lifecycle job stays idempotent (no duplicate reminders same day).
-- =====================================================================
ALTER TABLE subscriptions ADD COLUMN last_reminder_on DATE;
