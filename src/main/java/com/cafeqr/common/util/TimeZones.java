package com.cafeqr.common.util;

import java.time.ZoneId;

/**
 * The timezone every café operates in. All Serva cafés are in Oman (Gulf Standard
 * Time, {@code Asia/Muscat}, UTC+04:00 — no DST), so analytics day/hour bucketing,
 * "today" windows and weekly job boundaries all use this single zone. Centralising
 * it here keeps the off-by-4-hours bug from creeping back if someone reaches for
 * {@code ZoneOffset.UTC} again.
 */
public final class TimeZones {

    private TimeZones() {
    }

    /** The operating timezone for every café — {@code Asia/Muscat} (UTC+04:00, no DST). */
    public static final ZoneId CAFES = ZoneId.of("Asia/Muscat");
}
