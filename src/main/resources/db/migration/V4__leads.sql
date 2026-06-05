-- =====================================================================
-- Inbound "request access / book a demo" submissions from the marketing
-- landing page. Public POST (no auth); platform admin can list them.
-- =====================================================================
CREATE TABLE leads (
    id           BIGSERIAL PRIMARY KEY,
    cafe_name    VARCHAR(150)  NOT NULL,
    contact_name VARCHAR(150)  NOT NULL,
    phone        VARCHAR(40),
    email        VARCHAR(150),
    city         VARCHAR(100),
    note         VARCHAR(1000),
    status       VARCHAR(20)   NOT NULL DEFAULT 'NEW',
    created_at   TIMESTAMPTZ   NOT NULL,
    updated_at   TIMESTAMPTZ   NOT NULL
);

CREATE INDEX idx_leads_created_at ON leads (created_at DESC);
