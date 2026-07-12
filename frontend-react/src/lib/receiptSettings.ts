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
  vatNumber: string;
  crNumber: string;
}

export const RECEIPT_DEFAULTS: ReceiptSettings = {
  style: 'classic',
  showLogo: false,
  showPhone: true,
  footerText: '',
  vatNumber: '',
  crNumber: '',
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
      vatNumber: typeof raw.vatNumber === 'string' ? raw.vatNumber : RECEIPT_DEFAULTS.vatNumber,
      crNumber: typeof raw.crNumber === 'string' ? raw.crNumber : RECEIPT_DEFAULTS.crNumber,
    };
  } catch {
    return { ...RECEIPT_DEFAULTS };
  }
}
