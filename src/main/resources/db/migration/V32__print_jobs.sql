-- Reliable auto-print: completing an order enqueues a job here; the branch's print-station
-- device pulls PENDING jobs and acks them after printing. At-least-once delivery — a frozen
-- or asleep tablet catches up on wake instead of silently missing receipts (the SSE event
-- alone is fire-and-forget and dies with a suspended browser tab).
CREATE TABLE print_jobs (
    id            BIGSERIAL     PRIMARY KEY,
    restaurant_id BIGINT        NOT NULL REFERENCES restaurants (id),
    branch_id     BIGINT        NOT NULL REFERENCES branches (id),
    order_id      BIGINT        NOT NULL REFERENCES orders (id),
    status        VARCHAR(20)   NOT NULL,
    printed_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL,
    updated_at    TIMESTAMPTZ   NOT NULL
);

CREATE INDEX idx_print_jobs_branch_pending ON print_jobs (branch_id) WHERE status = 'PENDING';
