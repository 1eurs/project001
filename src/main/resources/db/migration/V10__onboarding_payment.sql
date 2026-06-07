-- =====================================================================
-- Self-serve onboarding: the café pays the platform a one-time fee by
-- bank transfer. We record the claimed payment on the subscription and a
-- platform admin confirms it (which activates the restaurant + owner).
-- =====================================================================
ALTER TABLE subscriptions
    ADD COLUMN payment_method       VARCHAR(20),
    ADD COLUMN payment_reference    VARCHAR(40),
    ADD COLUMN payment_confirmed_at TIMESTAMPTZ,
    ADD COLUMN payment_confirmed_by BIGINT;

-- Reference is what the café writes in their transfer note; admins reconcile by it.
CREATE INDEX idx_subscriptions_payment_reference ON subscriptions (payment_reference);

-- Speeds up the admin "pending onboarding" list.
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
