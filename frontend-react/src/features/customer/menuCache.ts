import type { PublicMenu } from '../../lib/types';

// Last-seen menu for this device. Regulars scanning the same café's QR paint the
// menu instantly from here while React Query refetches fresh data in the background.
const KEY = 'cafeqr_menu_cache';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Entry { url: string; t: number; data: PublicMenu }

export function readMenuCache(url: string): PublicMenu | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry;
    if (entry.url !== url || Date.now() - entry.t > MAX_AGE_MS) return undefined;
    return entry.data;
  } catch {
    return undefined;
  }
}

export function writeMenuCache(url: string, data: PublicMenu) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ url, t: Date.now(), data } satisfies Entry));
  } catch { /* quota/private mode — the cache is best-effort */ }
}
