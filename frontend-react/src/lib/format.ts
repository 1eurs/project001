// Money is OMR with 3 decimals everywhere. Never compute VAT on the client for
// display of an order — the server returns vatAmount/total. We only *estimate*
// the cart subtotal/VAT before submission.

export const omr = (n: number | string | null | undefined): string =>
  Number(n ?? 0).toFixed(3);

/** vatRate from the API is a percent (e.g. 5 = 5%). */
export const estimateVat = (subtotal: number, vatRatePercent: number, enabled: boolean): number =>
  enabled ? subtotal * (vatRatePercent / 100) : 0;

export const fmtElapsed = (sinceIso: string | number): string => {
  const ms = Date.now() - (typeof sinceIso === 'number' ? sinceIso : new Date(sinceIso).getTime());
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
