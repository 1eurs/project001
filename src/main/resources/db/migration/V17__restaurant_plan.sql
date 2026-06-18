-- =====================================================================
-- Restaurant pricing tier: STANDARD or PRO. Gates the Pro analytics
-- features (funnel, staff leaderboard, forecast, benchmarking, …).
--
-- Defaults to PRO so every cafe currently live keeps full access on
-- rollout — a platform admin downgrades a cafe to STANDARD when needed.
-- =====================================================================
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'PRO';