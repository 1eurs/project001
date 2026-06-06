// Shared car-colour palette: the customer picks one (sends the `key`), the cafe
// dashboard renders the swatch + localised label by looking the key back up.
import type { Lang } from './types';

export interface CarColor { key: string; hex: string; ar: string; en: string; ring?: boolean }

export const CAR_COLORS: CarColor[] = [
  { key: 'white',  hex: '#eceff3', ar: 'أبيض',  en: 'White', ring: true },
  { key: 'silver', hex: '#b9bec6', ar: 'فضي',   en: 'Silver' },
  { key: 'gray',   hex: '#6b7280', ar: 'رمادي', en: 'Gray' },
  { key: 'black',  hex: '#16181d', ar: 'أسود',  en: 'Black' },
  { key: 'red',    hex: '#d32f2f', ar: 'أحمر',  en: 'Red' },
  { key: 'blue',   hex: '#2563eb', ar: 'أزرق',  en: 'Blue' },
  { key: 'green',  hex: '#15803d', ar: 'أخضر',  en: 'Green' },
  { key: 'brown',  hex: '#8a5a34', ar: 'بني',   en: 'Brown' },
  { key: 'beige',  hex: '#d9c9a3', ar: 'بيج',   en: 'Beige', ring: true },
  { key: 'gold',   hex: '#c4a13a', ar: 'ذهبي',  en: 'Gold' },
];

const BY_KEY = new Map(CAR_COLORS.map((c) => [c.key, c]));

export const carColorOf = (key?: string | null): CarColor | undefined =>
  key ? BY_KEY.get(key.toLowerCase()) : undefined;

/** Localised label for a stored colour key, falling back to the raw value. */
export const carColorLabel = (key: string | null | undefined, lang: Lang): string => {
  const c = carColorOf(key);
  return c ? (lang === 'ar' ? c.ar : c.en) : (key ?? '');
};
