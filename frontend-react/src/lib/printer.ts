/* Print a receipt via RawBT (https://rawbt.ru) on the one tablet that sits next to the
   thermal printer ("print station").

   Architecture (multi-staff):
     - Every open dashboard receives order.completed over SSE.
     - Only the tablet with the local "print station" flag set actually prints.
     - Completing an order on tablet A still prints on tablet B (the print station).
     - That path has NO user gesture — Chrome will not launch external apps from SSE —
       so we prefer RawBT's local WebSocket (silent), then fall back to the rawbt: scheme
       via a hidden iframe. We never send people to the Play Store when RawBT is installed.

   Receipts are sent as pre-built ESC/POS raster bytes (not text): thermal printers can't
   do Arabic shaping/RTL, so we rasterize the bilingual invoice (ReceiptCapture.tsx).
   See rawbt.ru / rawbt_ws_server for the integration surface. */

const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';

// Local RawBT / "Server for RawBT" WebSocket — works without a user gesture, so it's the
// right path for SSE-driven auto-print on the print-station tablet.
const RAWBT_WS_URL = 'ws://127.0.0.1:40213/';
const RAWBT_WS_TIMEOUT_MS = 1800;

// Dedupe: complete-on-print-station can also arrive again via SSE; skip a second print.
const recentPrints = new Map<number, number>();
const PRINT_DEDUP_MS = 15_000;

export function rememberPrintedOrder(orderId: number): void {
  recentPrints.set(orderId, Date.now());
  // Drop stale entries so the map can't grow forever across a long shift.
  if (recentPrints.size > 40) {
    const cutoff = Date.now() - PRINT_DEDUP_MS;
    for (const [id, at] of recentPrints) {
      if (at < cutoff) recentPrints.delete(id);
    }
  }
}

export function wasRecentlyPrinted(orderId: number): boolean {
  const at = recentPrints.get(orderId);
  if (at == null) return false;
  if (Date.now() - at > PRINT_DEDUP_MS) {
    recentPrints.delete(orderId);
    return false;
  }
  return true;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  // Char-by-char avoids apply/spread arg limits on large receipts (Android WebView).
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** Silent print via local RawBT WebSocket. No user gesture required — used for SSE auto-print. */
function tryWebSocketPrint(escPosBytes: Uint8Array): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(RAWBT_WS_URL);
    } catch {
      finish(false);
      return;
    }

    ws.binaryType = 'arraybuffer';
    const timer = window.setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      finish(false);
    }, RAWBT_WS_TIMEOUT_MS);

    ws.onerror = () => finish(false);
    ws.onclose = () => {
      // If we never opened, treat as failure; if we already finished ok, no-op.
      finish(false);
    };
    ws.onopen = () => {
      try {
        // The wire format is the SAME intent-URI string an Android launch uses — the server
        // strips "intent:base64," + the "#Intent;...end;" suffix and base64-decodes the rest
        // (verified in rawbt_ws_server/src/server.php and escpos-php's RawbtPrintConnector,
        // which this port's official web demo sends verbatim). Raw binary frames are NOT the
        // protocol: the server ignores them while the connection still "succeeds", which
        // looks like a print that never comes out.
        ws.send(`intent:base64,${bytesToBase64(escPosBytes)}#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end;`);
        try { ws.close(1000, 'done'); } catch { /* ignore */ }
        finish(true);
      } catch {
        finish(false);
      }
    };
  });
}

// Silent hidden-iframe path via the bare "rawbt:" scheme (no package attribute, so no Play
// Store fallback and no visible navigation) — used whenever the local WebSocket isn't
// reachable. A carrier window (window.open + later .location.href) was tried here to preserve
// manual clicks' user-gesture across the async capture, but on mobile Chrome that window
// sometimes never got navigated or closed, leaving a blank tab open. The iframe never opens
// anything visible, so a blocked/failed launch just does nothing instead of misbehaving.
function fireSchemePrint(payload: string): void {
  const rawbtUrl = `rawbt:${payload}`;
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
    iframe.src = rawbtUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      try { iframe.remove(); } catch { /* ignore */ }
    }, 4000);
  } catch {
    /* ignore */
  }
}

/** Fires RawBT with a base64 PNG payload — kept as a fallback; prefer printRasterViaRawBt. */
export function printImageViaRawBt(pngDataUrl: string): void {
  const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
  fireSchemePrint(`data:image/png;base64,${base64}`);
}

/**
 * Send pre-built ESC/POS raster bytes to RawBT. Resolves true only when the local WebSocket
 * server ("Server for RawBT") confirmed the connection — the one path that's verifiable AND
 * works without a user gesture.
 *
 * The rawbt: scheme fallback runs only when `allowSchemeFallback` (manual prints, where the
 * tap's gesture lets Chrome launch the app). Gesture-less queue prints must NOT use it:
 * Chrome silently blocks scheme navigation without a gesture, and since we can't observe
 * that, acking on it loses receipts. Returning false instead leaves the job PENDING, so it
 * retries and prints as soon as Server for RawBT is back.
 */
/** Last handoff outcome, surfaced in the print-station settings so staff can see what
 *  happened on a device with no devtools. */
export type PrintAttempt = { at: number; ok: boolean; via: 'server' | 'app-link' | 'none' };
let lastAttempt: PrintAttempt | null = null;
export const getLastPrintAttempt = (): PrintAttempt | null => lastAttempt;

export async function printRasterViaRawBt(
  escPosBytes: Uint8Array,
  opts: { allowSchemeFallback: boolean },
): Promise<boolean> {
  if (await tryWebSocketPrint(escPosBytes)) {
    lastAttempt = { at: Date.now(), ok: true, via: 'server' };
    return true;
  }
  if (opts.allowSchemeFallback) {
    fireSchemePrint(`base64,${bytesToBase64(escPosBytes)}`);
    lastAttempt = { at: Date.now(), ok: false, via: 'app-link' };
  } else {
    lastAttempt = { at: Date.now(), ok: false, via: 'none' };
  }
  return false;
}

/** Probe whether the local "Server for RawBT" WebSocket is reachable (setup status UI). */
export function checkPrintServer(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };
    let ws: WebSocket;
    try {
      ws = new WebSocket(RAWBT_WS_URL);
    } catch {
      resolve(false);
      return;
    }
    const timer = window.setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      finish(false);
    }, RAWBT_WS_TIMEOUT_MS);
    ws.onerror = () => finish(false);
    ws.onopen = () => {
      try { ws.close(1000, 'probe'); } catch { /* ignore */ }
      finish(true);
    };
  });
}

/** Packs an already-1-bit (pure black/white) canvas into a single ESC/POS "GS v 0" raster
 *  image command — MSB-first, 1 bit per pixel, 1 = black. No ESC @ / cut here: RawBT wraps
 *  whatever it's given with its own job init/cut framing.
 *
 *  Deliberately ONE monolithic command: this exact format printed pixel-perfect through both
 *  the tablet's RawBT intent path and a 90KB single-frame WebSocket probe. A banded variant
 *  (raster bands + ESC J feeds over blank stretches, meant to shrink payloads below Chrome's
 *  WebSocket fragmentation threshold) produced wrong spacing / garbled headers on the real
 *  printer — its ESC J timing/units interact badly with this hardware, so don't reintroduce
 *  it without printing on the actual device. */
export function buildEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  const bytesPerRow = Math.ceil(width / 8);
  const raster = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let byteX = 0; byteX < bytesPerRow; byteX++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteX * 8 + bit;
        if (x < width && data[(y * width + x) * 4] < 128) byte |= 0x80 >> bit;
      }
      raster[y * bytesPerRow + byteX] = byte;
    }
  }
  const header = new Uint8Array([
    0x1d, 0x76, 0x30, 0x00, // GS v 0, mode = normal
    bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff,
  ]);
  const out = new Uint8Array(header.length + raster.length);
  out.set(header, 0);
  out.set(raster, header.length);
  return out;
}

// "Is this the print station" is per-device, per-branch, local only — the server has no
// notion of which tablet is which. Only this flag + branch.printerEnabled gate SSE printing.
const printStationKey = (branchId: number) => `serva_print_station_${branchId}`;

export function isPrintStation(branchId: number): boolean {
  return localStorage.getItem(printStationKey(branchId)) === '1';
}

export function setPrintStation(branchId: number, on: boolean): void {
  if (on) localStorage.setItem(printStationKey(branchId), '1');
  else localStorage.removeItem(printStationKey(branchId));
}
