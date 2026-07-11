// On-demand Google Fonts loading. index.html ships only the core UI fonts
// (IBM Plex Sans Arabic + Mono); every other family is injected by the route
// or theme that actually uses it, so customer menus don't pay for dashboard
// and gallery display fonts.

const requested = new Set<string>();

/** Injects a stylesheet link once; later calls with the same href are no-ops. */
export function ensureStylesheet(href: string) {
  if (requested.has(href)) return;
  requested.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  // Google Fonts sends CORS headers on its CSS responses; without this, html-to-image
  // (ReceiptCapture.tsx) can't read the stylesheet's rules to embed the font in a capture.
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/** `specs` use the css2 family syntax, e.g. `Tajawal:wght@400;500;700`. */
export function ensureGoogleFonts(specs: string[]) {
  if (specs.length === 0) return;
  ensureStylesheet(
    'https://fonts.googleapis.com/css2?' +
      specs.map((s) => 'family=' + s).join('&') +
      '&display=swap',
  );
}

/** Heavy Bricolage display type for the BOLD skin: landing, signup, legal, dashboard + QR badge. */
export const BOLD_FONTS = [
  'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800',
];
