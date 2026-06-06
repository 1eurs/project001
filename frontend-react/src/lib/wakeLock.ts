// Keep the screen awake while the live board is open (café phone / tablet on
// the counter). Re-acquires after the tab is backgrounded and comes back.
// No-op on browsers without the Screen Wake Lock API.
import { useEffect } from 'react';

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: any = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await (navigator as any).wakeLock.request('screen');
        lock.addEventListener?.('release', () => { lock = null; });
      } catch { /* denied (e.g. low battery) — ignore */ }
    };
    const onVisible = () => { if (!cancelled && document.visibilityState === 'visible' && !lock) void acquire(); };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      try { lock?.release?.(); } catch { /* ignore */ }
      lock = null;
    };
  }, [active]);
}
