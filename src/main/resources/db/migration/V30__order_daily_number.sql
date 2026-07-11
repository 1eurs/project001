-- Per-branch ticket number shown to kitchen staff and customers, resets every business day
-- (café clock = Asia/Muscat). Kept separate from order_number, which stays a globally unique
-- reference used for URLs/receipts/logs.
CREATE TABLE branch_daily_counters (
    branch_id     BIGINT NOT NULL,
    business_date DATE   NOT NULL,
    last_number   INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_id, business_date)
);

ALTER TABLE orders ADD COLUMN daily_number INT NOT NULL DEFAULT 0;
