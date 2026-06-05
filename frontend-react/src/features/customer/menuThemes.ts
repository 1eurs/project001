// Per-venue "menu look" themes for App A (the customer-facing menu/cart/track).
// Each theme is a full, self-contained skin: the live palette + atmosphere lives
// in menu-themes.css under [data-menu-theme="<id>"]; the small mirror below feeds
// the in-app theme picker cards. Onyx is the default and is the only theme that
// follows the site's dark/light toggle — branded themes own their own look.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const MENU_THEMES: MenuTheme[] = [
  { id: 'onyx',  labelAr: 'أونيكس', labelEn: 'Onyx',  descAr: 'عصري · داكن',   descEn: 'Modern · dark',
    dark: true,  font: 'var(--font-ar)',
    swatch: { bg: '#0E0F12', ink: '#F3F5F0', accent: '#C6FF3A', accent2: '#A4E000' } },

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
];

export const DEFAULT_THEME = 'onyx';

export const isThemeId = (id: string | null | undefined): id is string =>
  !!id && MENU_THEMES.some((t) => t.id === id);

export const themeMeta = (id: string | null | undefined): MenuTheme =>
  MENU_THEMES.find((t) => t.id === id) ?? MENU_THEMES[0];

interface ThemeStore {
  bySlug: Record<string, string>;
  setTheme: (slug: string, id: string) => void;
}

/** Per-venue theme choice (what a café owner would pick), persisted in the browser. */
export const useMenuThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      bySlug: {},
      setTheme: (slug, id) => set((s) => ({ bySlug: { ...s.bySlug, [slug]: id } })),
    }),
    { name: 'cafeqr_menu_theme' },
  ),
);

/** Resolve the active theme for a venue: local choice → owner's saved default → Onyx. */
export function useThemeId(slug: string | null | undefined, restaurantTheme?: string | null): string {
  const chosen = useMenuThemeStore((s) => (slug ? s.bySlug[slug] : undefined));
  if (isThemeId(chosen)) return chosen;
  if (isThemeId(restaurantTheme)) return restaurantTheme;
  return DEFAULT_THEME;
}
