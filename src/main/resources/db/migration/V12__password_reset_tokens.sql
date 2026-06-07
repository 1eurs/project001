-- =====================================================================
-- Password reset: short-lived, single-use tokens emailed to the user.
-- =====================================================================
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL
);
CREATE UNIQUE INDEX ux_password_reset_tokens_token ON password_reset_tokens (token);
CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);
