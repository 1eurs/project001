import { useEffect } from 'react';
import { api } from '../../lib/api';

const SID_KEY = 'cafeqr_presence_sid';

/** Stable id per browser tab so the same visitor isn't counted twice. */
function sessionId(): string {
  let id = sessionStorage.getItem(SID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SID_KEY, id);
  }
  return id;
}

/**
 * Reports that this visitor is on a QR's menu right now, so the café dashboard can show the live
 * funnel. Pings on mount + every 20s while mounted; no-op without a branch.
 * @param qrKey    the table's qrCodeToken, or "car" / "takeaway"
 * @param ordering true once they have items in cart / are at checkout (vs just viewing)
 */
export function usePresence(branchId: number | null | undefined, qrKey: string | null, ordering: boolean) {
  useEffect(() => {
    if (!branchId || !qrKey) return;
    const sid = sessionId();
    const stage = ordering ? 'ordering' : 'viewing';
    const ping = () =>
      api.post('/api/public/presence', { branchId, qrKey, sessionId: sid, stage }, { auth: false }).catch(() => {});
    // Fire-and-forget "leave" on real exit (tab close / app exit) so the count drops instantly.
    // Not sent on in-app navigation (menu→cart) — there the customer is still present.
    const leave = () => {
      try {
        navigator.sendBeacon?.(
          '/api/public/presence',
          new Blob([JSON.stringify({ branchId, qrKey, sessionId: sid, stage: 'leave' })], { type: 'application/json' }),
        );
      } catch { /* ignore */ }
    };
    ping();
    const id = setInterval(ping, 20_000);
    window.addEventListener('pagehide', leave);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', leave);
    };
  }, [branchId, qrKey, ordering]);
}
