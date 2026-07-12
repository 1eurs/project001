/* Print a receipt via the RawBT app (https://rawbt.ru).

   Model: RawBT is installed on EVERY staff device, each paired with the same WiFi thermal
   printer — whichever device completes an order prints its receipt right there (plus the
   manual 🖨 buttons). No print-station designation, no cross-device forwarding, no local
   server component ("Server for RawBT" / WebSocket integration was tried and removed — the
   plain rawbt: scheme handoff is what works reliably on the actual hardware).

   Receipts are sent as pre-built ESC/POS raster bytes (not text): thermal printers can't
   do Arabic shaping/RTL, so we rasterize the bilingual invoice (ReceiptCapture.tsx). */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  // Char-by-char avoids apply/spread arg limits on large receipts (Android WebView).
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

// Hidden-iframe handoff via the bare "rawbt:" scheme (no package attribute, so no Play Store
// fallback and no visible navigation). A carrier window (window.open + later .location.href)
// was tried here to preserve the tap's user-gesture across the async capture, but on mobile
// Chrome that window sometimes never got navigated or closed, leaving a blank tab open. The
// iframe never opens anything visible; a blocked launch just does nothing.
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

/** Last handoff time, shown in the printing settings so staff can see the print fired on a
 *  device with no devtools. */
export type PrintAttempt = { at: number };
let lastAttempt: PrintAttempt | null = null;
export const getLastPrintAttempt = (): PrintAttempt | null => lastAttempt;

/** Hand pre-built ESC/POS raster bytes to the RawBT app via the rawbt: scheme. */
export function printRasterViaRawBt(escPosBytes: Uint8Array): void {
  fireSchemePrint(`base64,${bytesToBase64(escPosBytes)}`);
  lastAttempt = { at: Date.now() };
}

/** Packs an already-1-bit (pure black/white) canvas into a single ESC/POS "GS v 0" raster
 *  image command — MSB-first, 1 bit per pixel, 1 = black. No ESC @ / cut here: RawBT wraps
 *  whatever it's given with its own job init/cut framing.
 *
 *  Deliberately ONE monolithic command: this exact format printed pixel-perfect on the real
 *  hardware. A banded variant (raster bands + ESC J feeds over blank stretches) produced
 *  wrong spacing / garbled headers on the actual printer — don't reintroduce it without
 *  printing on the device. */
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
  // One dot (0.125mm — invisible on paper) in the bottom-left corner: RawBT trims trailing
  // all-blank raster lines from the job, which silently deleted the receipt's baked-in
  // bottom margin and made prints end flush against the cut. A single inked dot on the last
  // row makes the full height "real", so the paper actually feeds through the padding.
  raster[(height - 1) * bytesPerRow] |= 0x80;

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
