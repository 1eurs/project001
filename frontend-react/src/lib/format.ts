// Money is OMR with 3 decimals everywhere. Never compute VAT on the client for
// display of an order — the server returns vatAmount/total. We only *estimate*
// the cart subtotal/VAT before submission.

export const omr = (n: number | string | null | undefined): string =>
  Number(n ?? 0).toFixed(3);

/** Round to OMR's 3 decimals (mils) using half-up, mirroring the backend's BigDecimal(scale=3, HALF_UP).
 *  Use it on every client money figure before deriving another from it, so the subtotal / VAT / discount /
 *  total lines always reconcile instead of drifting apart by a fil through raw float arithmetic. */
export const round3 = (n: number): number => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** vatRate from the API is a percent (e.g. 5 = 5%). */
export const estimateVat = (subtotal: number, vatRatePercent: number, enabled: boolean): number =>
  enabled ? subtotal * (vatRatePercent / 100) : 0;

/** Whole-number percent off, for a discount badge (e.g. base 3, sale 2.4 → 20). */
export const discountPercent = (base: number, sale: number): number =>
  base > 0 ? Math.round((1 - sale / base) * 100) : 0;

/**
 * Keep phone inputs to what the backend's Phones.normalize accepts: digits
 * (Arabic-Indic converted to Latin) and one leading +. Everything else is
 * dropped as the user types, so a pasted "96-12 34" or "٩٦١٢٣٤" still works.
 */
export const sanitizePhone = (raw: string): string => {
  let out = '';
  for (const c of raw) {
    if (c >= '٠' && c <= '٩') out += String.fromCharCode(48 + c.charCodeAt(0) - 0x0660);
    else if (c >= '۰' && c <= '۹') out += String.fromCharCode(48 + c.charCodeAt(0) - 0x06f0);
    else if (c >= '0' && c <= '9') out += c;
    else if (c === '+' && out === '') out += c;
  }
  return out.slice(0, 16);
};

export const fmtElapsed = (sinceIso: string | number): string => {
  const ms = Date.now() - (typeof sinceIso === 'number' ? sinceIso : new Date(sinceIso).getTime());
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The ISO calendar date (YYYY-MM-DD) of {@code d} in the cafés' operating timezone
 * (Asia/Muscat, UTC+04:00, no DST). The backend buckets analytics by Oman local
 * day, so date params sent to the API must be Oman-local dates — NOT UTC dates.
 * {@code new Date().toISOString().slice(0,10)} would return the UTC date, which is
 * 4 hours behind Oman and would cut the "today" window short (and roll early-morning
 * orders into yesterday). Oman has no DST, so a fixed +4h offset is always correct.
 */
const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000;
export const omanDate = (d: Date = new Date()): string =>
  new Date(d.getTime() + MUSCAT_OFFSET_MS).toISOString().slice(0, 10);

/** Current hour (0-23) in Oman local time — for the "now" marker on the hourly chart. */
export const omanHour = (d: Date = new Date()): number =>
  new Date(d.getTime() + MUSCAT_OFFSET_MS).getUTCHours();
