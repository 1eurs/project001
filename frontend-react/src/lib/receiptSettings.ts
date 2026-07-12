// Per-café receipt customization document, stored as free-form JSON on the restaurant
// (receiptSettingsJson — same contract as themeCustomJson: frontend owns the schema, the
// backend only validates "JSON object, sane size"). Every field has a default so a café
// that never touched the settings prints the classic layout unchanged.

export type ReceiptStyle = 'classic' | 'minimal' | 'bold' | 'retro' | 'fancy' | 'ticket';

export interface ReceiptSettings {
  style: ReceiptStyle;
  showLogo: boolean;
  /** Café phone under the name — on by default so untouched cafés keep today's receipt. */
  showPhone: boolean;
  footerText: string;
  /** Id into FOOTER_ART — a fun text-art stamp under the footer ('' = none). */
  footerArt: string;
  vatNumber: string;
  crNumber: string;
}

export const RECEIPT_DEFAULTS: ReceiptSettings = {
  style: 'classic',
  showLogo: false,
  showPhone: true,
  footerText: '',
  footerArt: '',
  vatNumber: '',
  crNumber: '',
};

/* Text-art footer stamps. Rendered in a monospace <pre> by the device browser (never by the
   printer's font engine), so alignment and glyphs survive the raster print pipeline intact. */
export const FOOTER_ART: Record<string, { label: { en: string; ar: string }; art: string }> = {
  cat: {
    label: { en: 'Cat', ar: 'قطة' },
    art: [
      ' /\\_/\\',
      '( ^.^ )',
      ' > ^ <',
    ].join('\n'),
  },
  bear: {
    label: { en: 'Bear', ar: 'دب' },
    art: 'ʕ •ᴥ• ʔ',
  },
  sparkle: {
    label: { en: 'Sparkles', ar: 'بريق' },
    art: '✧ ･ﾟ: * ✧ ･ﾟ: *',
  },
  smile: {
    label: { en: 'Smile', ar: 'ابتسامة' },
    art: '( ◕ ‿ ◕ )',
  },
  heart: {
    label: { en: 'Heart', ar: 'قلب' },
    art: '♡´･ᴗ･`♡',
  },
  flower: {
    label: { en: 'Flower', ar: 'زهرة' },
    art: '✿ ❀ ✿',
  },
  music: {
    label: { en: 'Music', ar: 'موسيقى' },
    art: '♪ ♫ ♪',
  },
  butterfly: {
    label: { en: 'Butterfly', ar: 'فراشة' },
    art: 'ƸӜƷ',
  },
  star: {
    label: { en: 'Star', ar: 'نجمة' },
    art: '✦ ★ ✦',
  },
  wink: {
    label: { en: 'Wink', ar: 'غمزة' },
    art: '( ^_°)~',
  },
  wave: {
    label: { en: 'Wave', ar: 'موجة' },
    art: '〜(￣▽￣)〜',
  },
};

const STYLES: ReceiptStyle[] = ['classic', 'minimal', 'bold', 'retro', 'fancy', 'ticket'];

/** Tolerant parse: unknown keys ignored, wrong types fall back to defaults, null/garbage → defaults. */
export function parseReceiptSettings(json: string | null | undefined): ReceiptSettings {
  if (!json) return { ...RECEIPT_DEFAULTS };
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    return {
      style: STYLES.includes(raw.style as ReceiptStyle) ? (raw.style as ReceiptStyle) : RECEIPT_DEFAULTS.style,
      showLogo: typeof raw.showLogo === 'boolean' ? raw.showLogo : RECEIPT_DEFAULTS.showLogo,
      showPhone: typeof raw.showPhone === 'boolean' ? raw.showPhone : RECEIPT_DEFAULTS.showPhone,
      footerText: typeof raw.footerText === 'string' ? raw.footerText : RECEIPT_DEFAULTS.footerText,
      footerArt: typeof raw.footerArt === 'string' && raw.footerArt in FOOTER_ART ? raw.footerArt : RECEIPT_DEFAULTS.footerArt,
      vatNumber: typeof raw.vatNumber === 'string' ? raw.vatNumber : RECEIPT_DEFAULTS.vatNumber,
      crNumber: typeof raw.crNumber === 'string' ? raw.crNumber : RECEIPT_DEFAULTS.crNumber,
    };
  } catch {
    return { ...RECEIPT_DEFAULTS };
  }
}
