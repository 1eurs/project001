// Per-venue "menu look" themes for App A (the customer-facing menu/cart/track).
// Each theme is a full, self-contained skin: the live palette + atmosphere lives
// in menu-themes.css under [data-menu-theme="<id>"]; the small mirror below feeds
// the in-app theme picker cards. Onyx is the default and is the only theme that
// follows the site's dark/light toggle — branded themes own their own look.
export interface MenuTheme {
  id: string;
  labelAr: string; labelEn: string;
  descAr: string;  descEn: string;
  dark: boolean;
  /** font-family for display headings — must match --font-display in menu-themes.css */
  font: string;
  /** preview swatch for the picker card (mirrors the css tokens) */
  swatch: { bg: string; ink: string; accent: string; accent2: string };
}

export interface MenuThemeCustom {
  canvas: string;
  paper: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  cartBg: string;
  motifColor: string;
  motifOpacity: number;
  background: 'soft' | 'arches' | 'dots' | 'waves' | 'tiles' | 'linen';
  motif: 'none' | 'bean' | 'cup' | 'palm' | 'star' | 'crescent' | 'leaf' | 'drop' | 'geo';
}

export const MENU_THEMES: MenuTheme[] = [
  { id: 'onyx',  labelAr: 'أونيكس', labelEn: 'Onyx',  descAr: 'عصري · داكن',   descEn: 'Modern · dark',
    dark: true,  font: 'var(--font-ar)',
    swatch: { bg: '#0E0F12', ink: '#F3F5F0', accent: '#10b981', accent2: '#059669' } },

  { id: 'qahwa', labelAr: 'قهوة',  labelEn: 'Qahwa', descAr: 'دافئ · مقهى',    descEn: 'Warm · café',
    dark: false, font: "'Markazi Text', serif",
    swatch: { bg: '#FBF5EC', ink: '#2C1B12', accent: '#C8862B', accent2: '#A86A1C' } },

  { id: 'warda', labelAr: 'وردة',  labelEn: 'Warda', descAr: 'لطيف · حلويات',  descEn: 'Cute · sweet',
    dark: false, font: "'Baloo Bhaijaan 2', system-ui",
    swatch: { bg: '#FFF1F4', ink: '#5A2233', accent: '#FF7AA2', accent2: '#FF5C89' } },

  { id: 'mint',  labelAr: 'نعناع', labelEn: 'Mint',  descAr: 'منعش · صحّي',    descEn: 'Fresh · clean',
    dark: false, font: "'Tajawal', sans-serif",
    swatch: { bg: '#F2F8F2', ink: '#143F2B', accent: '#2FBF71', accent2: '#1FA85E' } },

  { id: 'bahr',  labelAr: 'بحر',   labelEn: 'Bahr',  descAr: 'ساحلي · مطرح',   descEn: 'Coastal · Mutrah',
    dark: false, font: "'El Messiri', sans-serif",
    swatch: { bg: '#F3F1E9', ink: '#0B3B47', accent: '#E2674A', accent2: '#D24E32' } },

  { id: 'bahar', labelAr: 'بهارات', labelEn: 'Bahar', descAr: 'جريء · سوق',    descEn: 'Bold · souq',
    dark: false, font: "'Reem Kufi', sans-serif",
    swatch: { bg: '#FBEEE0', ink: '#4A1C0E', accent: '#D7521E', accent2: '#E8A23D' } },

  { id: 'layl',  labelAr: 'ليل',   labelEn: 'Layl',  descAr: 'فاخر · ذهبي',    descEn: 'Luxe · gold',
    dark: true,  font: "'Markazi Text', serif",
    swatch: { bg: '#14110D', ink: '#F3ECDD', accent: '#D4AF6C', accent2: '#B8924A' } },

  { id: 'sikka', labelAr: 'سِكّة', labelEn: 'Sikka', descAr: 'حضري · نيون', descEn: 'Urban · neon',
    dark: true, font: "'Tajawal', sans-serif",
    swatch: { bg: '#101417', ink: '#EAF7F6', accent: '#32D6C8', accent2: '#FF6D9E' } },

  { id: 'majlis', labelAr: 'مجلس', labelEn: 'Majlis', descAr: 'تراثي · زمرد', descEn: 'Heritage · emerald',
    dark: true, font: "'Reem Kufi', sans-serif",
    swatch: { bg: '#10251E', ink: '#F2E8D0', accent: '#C79A43', accent2: '#2EA37A' } },

  { id: 'azraq', labelAr: 'أزرق', labelEn: 'Azraq', descAr: 'بلاط · هادئ', descEn: 'Tile · calm',
    dark: false, font: "'El Messiri', sans-serif",
    swatch: { bg: '#EEF6F8', ink: '#123846', accent: '#227D9A', accent2: '#E0A43B' } },

  { id: 'nakhla', labelAr: 'نخلة', labelEn: 'Nakhla', descAr: 'حديقة · تمر', descEn: 'Garden · dates',
    dark: false, font: "'Markazi Text', serif",
    swatch: { bg: '#F7F2E6', ink: '#213B24', accent: '#6D8C3B', accent2: '#C8833A' } },
];

export const DEFAULT_THEME = 'onyx';
export const CUSTOM_THEME = 'custom';

export const DEFAULT_CUSTOM_THEME: MenuThemeCustom = {
  canvas: '#F2ECE3',
  paper: '#FFF9F0',
  surface: '#F0E1D1',
  text: '#2B2118',
  muted: '#766759',
  accent: '#2F8F6B',
  accent2: '#E6A93F',
  cartBg: '#1D2A24',
  motifColor: '#2F8F6B',
  motifOpacity: 0.15,
  background: 'arches',
  motif: 'bean',
};

/** Shared motif list — the single source of truth for both the picker UI and validation. */
export const MOTIF_OPTIONS: MenuThemeCustom['motif'][] =
  ['none', 'bean', 'cup', 'palm', 'star', 'crescent', 'leaf', 'drop', 'geo'];
const BACKGROUND_OPTIONS: MenuThemeCustom['background'][] =
  ['soft', 'arches', 'dots', 'waves', 'tiles', 'linen'];

export const isThemeId = (id: string | null | undefined): id is string =>
  !!id && (id === CUSTOM_THEME || MENU_THEMES.some((t) => t.id === id));

export const themeMeta = (id: string | null | undefined): MenuTheme =>
  MENU_THEMES.find((t) => t.id === id) ?? MENU_THEMES[0];

/** Resolve the active public-menu theme chosen by the cafe owner. */
export const resolveThemeId = (restaurantTheme?: string | null): string =>
  isThemeId(restaurantTheme) ? restaurantTheme : DEFAULT_THEME;

export function parseCustomTheme(json?: string | null): MenuThemeCustom {
  if (!json) return DEFAULT_CUSTOM_THEME;
  try {
    const parsed = JSON.parse(json) as Partial<MenuThemeCustom>;
    const next = { ...DEFAULT_CUSTOM_THEME };
    Object.entries(parsed).forEach(([key, value]) => {
      if (key === 'background' && typeof value === 'string' && (BACKGROUND_OPTIONS as string[]).includes(value)) {
        next.background = value as MenuThemeCustom['background'];
        return;
      }
      if (key === 'motif' && typeof value === 'string' && (MOTIF_OPTIONS as string[]).includes(value)) {
        next.motif = value as MenuThemeCustom['motif'];
        return;
      }
      if (key === 'motifOpacity' && typeof value === 'number' && Number.isFinite(value)) {
        next.motifOpacity = clamp(value, 0.04, 0.3);
        return;
      }
      if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) && key in next) {
        (next as Record<string, string | number>)[key] = value;
      }
    });
    return next;
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
}

export const serializeCustomTheme = (custom: MenuThemeCustom): string => JSON.stringify(custom);

export function customThemeVars(custom: MenuThemeCustom): Record<string, string> {
  const bg = customBackground(custom);
  const paper = customPaper(custom);
  return {
    '--menu-canvas': bg.canvas,
    '--menu-paper-color': custom.paper,
    '--menu-paper-edge': hexAlpha(custom.text, 0.13),
    '--menu-paper-img': paper.image,
    '--menu-paper-size': paper.size,
    '--menu-paper-repeat': paper.repeat,
    '--bg': custom.paper,
    '--bg-2': mix(custom.paper, '#ffffff', 0.7),
    '--surface': hexAlpha(custom.surface, 0.72),
    '--surface-2': hexAlpha(custom.surface, 0.92),
    '--line': hexAlpha(custom.text, 0.11),
    '--line-2': hexAlpha(custom.text, 0.19),
    '--text': custom.text,
    '--muted': custom.muted,
    '--faint': hexAlpha(custom.muted, 0.72),
    '--accent': custom.accent,
    '--accent-2': custom.accent2,
    '--accent-ink': readableOn(custom.accent),
    '--accent-glow': hexAlpha(custom.accent, 0.26),
    // Prices/labels render in accent ON paper — nudge it toward the text colour so a
    // bright accent (yellow, lime, cyan) stays legible instead of washing out.
    '--accent-text': mix(custom.accent, custom.text, 0.24),
    '--canvas': custom.canvas,
    '--glass': hexAlpha(custom.paper, 0.78),
    '--ring': hexAlpha(custom.text, 0.08),
    '--shadow': `0 34px 78px -46px ${hexAlpha(custom.text, 0.45)}`,
    '--shadow-sm': `0 14px 30px -18px ${hexAlpha(custom.text, 0.25)}`,
    '--cart-bg': custom.cartBg,
    '--cart-ink': readableOn(custom.cartBg),
    '--cart-line': hexAlpha(readableOn(custom.cartBg), 0.14),
    '--cart-accent': custom.accent2,
    '--cart-accent-2': custom.accent,
    '--cart-accent-ink': readableOn(custom.accent2),
    '--cart-accent-text': custom.accent2,
    '--cart-sub': hexAlpha(readableOn(custom.cartBg), 0.68),
    '--cart-count-bg': custom.cartBg,
  };
}

function customBackground(custom: MenuThemeCustom): { canvas: string } {
  const glowA = hexAlpha(custom.accent, 0.18);
  const glowB = hexAlpha(custom.accent2, 0.18);
  if (custom.background === 'arches') {
    return { canvas: `${svgUrl(archSvg(custom.accent, custom.accent2))},radial-gradient(820px 520px at 14% 0%, ${glowA}, transparent 60%),linear-gradient(160deg, ${custom.canvas} 0%, ${custom.paper} 54%, ${custom.surface} 100%)` };
  }
  if (custom.background === 'dots') {
    return { canvas: `radial-gradient(circle at 1px 1px, ${hexAlpha(custom.text, 0.13)} 1px, transparent 0),linear-gradient(160deg, ${custom.canvas}, ${custom.paper})` };
  }
  if (custom.background === 'waves') {
    return { canvas: `${svgUrl(waveSvg(custom.accent))},radial-gradient(900px 520px at 90% 0%, ${glowB}, transparent 60%),linear-gradient(160deg, ${custom.canvas}, ${custom.paper})` };
  }
  if (custom.background === 'tiles') {
    return { canvas: `linear-gradient(45deg, ${hexAlpha(custom.accent, 0.10)} 25%, transparent 25%),linear-gradient(-45deg, ${hexAlpha(custom.accent2, 0.10)} 25%, transparent 25%),linear-gradient(160deg, ${custom.canvas}, ${custom.paper})` };
  }
  if (custom.background === 'linen') {
    return { canvas: `repeating-linear-gradient(90deg, ${hexAlpha(custom.text, 0.035)} 0 1px, transparent 1px 5px),repeating-linear-gradient(0deg, ${hexAlpha(custom.text, 0.025)} 0 1px, transparent 1px 6px),linear-gradient(160deg, ${custom.canvas}, ${custom.paper})` };
  }
  return { canvas: `radial-gradient(820px 520px at 14% 0%, ${glowA}, transparent 60%),radial-gradient(820px 560px at 88% 4%, ${glowB}, transparent 58%),linear-gradient(160deg, ${custom.canvas} 0%, ${custom.paper} 52%, ${custom.surface} 100%)` };
}

function customPaper(custom: MenuThemeCustom): { image: string; size: string; repeat: string } {
  const base = `radial-gradient(95% 50% at 90% 0%, ${hexAlpha(custom.accent, 0.14)}, transparent 58%)`;
  if (custom.motif === 'none') {
    return { image: base, size: 'auto,120px 120px', repeat: 'no-repeat,repeat' };
  }
  const motifColor = custom.motifColor || custom.accent;
  const motifOpacity = clamp(custom.motifOpacity, 0.04, 0.3);
  return {
    image: `${base},${svgUrl(motifSvg(custom.motif, motifColor, custom.text, motifOpacity))}`,
    size: 'auto,96px 96px,120px 120px',
    repeat: 'no-repeat,repeat,repeat',
  };
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function archSvg(accent: string, accent2: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><g fill="none" stroke="${accent}" stroke-opacity=".16" stroke-width="2"><path d="M30 160V78a60 60 0 0 1 120 0v82"/><path d="M58 160V84a32 32 0 0 1 64 0v76"/></g><circle cx="148" cy="28" r="8" fill="${accent2}" fill-opacity=".16"/></svg>`;
}

function waveSvg(accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><path d="M0 72c40-36 80-36 120 0s80 36 120 0" fill="none" stroke="${accent}" stroke-opacity=".14" stroke-width="3"/><path d="M0 96c40-28 80-28 120 0s80 28 120 0" fill="none" stroke="${accent}" stroke-opacity=".09" stroke-width="2"/></svg>`;
}

function motifSvg(motif: MenuThemeCustom['motif'], accent: string, text: string, opacity: number): string {
  const detailOpacity = Math.max(0.04, opacity * 0.72).toFixed(3);
  const fillOpacity = opacity.toFixed(3);
  if (motif === 'cup') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="none" stroke="${accent}" stroke-opacity="${fillOpacity}" stroke-width="3" stroke-linecap="round"><path d="M26 44h34v10a17 17 0 0 1-17 17 17 17 0 0 1-17-17z"/><path d="M60 48h8a8 8 0 0 1 0 16h-7"/><path d="M34 30c-5-6 5-8 0-14M48 30c-5-6 5-8 0-14"/></g></svg>`;
  }
  if (motif === 'palm') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="none" stroke="${accent}" stroke-opacity="${fillOpacity}" stroke-width="3" stroke-linecap="round"><path d="M48 80V38"/><path d="M48 40c-16-18-30-7-36 4 14-2 24 1 36-4zM48 40c16-18 30-7 36 4-14-2-24 1-36-4zM48 42c-12-8-19 3-21 13 9-7 15-9 21-13zM48 42c12-8 19 3 21 13-9-7-15-9-21-13z"/></g></svg>`;
  }
  if (motif === 'star') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><path d="M48 17l8 23 23 8-23 8-8 23-8-23-23-8 23-8z" fill="${accent}" fill-opacity="${fillOpacity}"/><circle cx="18" cy="20" r="3" fill="${text}" fill-opacity="${detailOpacity}"/><circle cx="78" cy="76" r="3" fill="${text}" fill-opacity="${detailOpacity}"/></svg>`;
  }
  if (motif === 'crescent') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><path d="M62 20a30 30 0 1 0 0 56 24 24 0 1 1 0-56z" fill="${accent}" fill-opacity="${fillOpacity}"/><path d="M70 28l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="${text}" fill-opacity="${detailOpacity}"/></svg>`;
  }
  if (motif === 'leaf') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><path d="M48 16c15 11 15 43 0 64-15-21-15-53 0-64z" fill="${accent}" fill-opacity="${fillOpacity}"/><path d="M48 24v48M48 42c6-5 12-7 18-7M48 54c-6-5-12-7-18-7" stroke="${text}" stroke-opacity="${detailOpacity}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  }
  if (motif === 'drop') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><path d="M48 20c13 16 19 27 19 38a19 19 0 0 1-38 0c0-11 6-22 19-38z" fill="${accent}" fill-opacity="${fillOpacity}"/><path d="M39 58a9 9 0 0 0 9 9" stroke="${text}" stroke-opacity="${detailOpacity}" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  }
  if (motif === 'geo') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="none" stroke="${accent}" stroke-opacity="${fillOpacity}" stroke-width="3"><rect x="30" y="30" width="36" height="36"/><rect x="30" y="30" width="36" height="36" transform="rotate(45 48 48)"/></g><circle cx="48" cy="48" r="5" fill="${text}" fill-opacity="${detailOpacity}"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="${accent}" fill-opacity="${fillOpacity}"><ellipse cx="36" cy="48" rx="11" ry="18" transform="rotate(25 36 48)"/><ellipse cx="60" cy="48" rx="11" ry="18" transform="rotate(-25 60 48)"/></g><path d="M35 36c3 8 3 16 0 24M61 36c-3 8-3 16 0 24" stroke="${text}" stroke-opacity="${detailOpacity}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
}

function hexAlpha(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mix(a: string, b: string, weight: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  const r = Math.round(ca.r * (1 - weight) + cb.r * weight);
  const g = Math.round(ca.g * (1 - weight) + cb.g * weight);
  const bl = Math.round(ca.b * (1 - weight) + cb.b * weight);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function readableOn(hex: string): string {
  const { r, g, b } = toRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 160 ? '#171109' : '#FFF9EF';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}
