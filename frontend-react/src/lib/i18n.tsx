// Lightweight i18n: a provider that tracks language + document direction, plus
// helpers to translate a local dictionary and to pick the right bilingual field.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './types';

interface I18nValue { lang: Lang; dir: 'rtl' | 'ltr'; setLang: (l: Lang) => void; toggle: () => void; }
const Ctx = createContext<I18nValue>({ lang: 'ar', dir: 'rtl', setLang: () => {}, toggle: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem('cafeqr_lang') as Lang) || 'ar');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('cafeqr_lang', lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === 'ar' ? 'en' : 'ar'));
  return <Ctx.Provider value={{ lang, dir, setLang, toggle }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export type Dict = Record<Lang, Record<string, string>>;
/** Translate a key against a local dictionary for the current language. */
export const useT = (dict: Dict) => {
  const { lang } = useI18n();
  return (key: string) => dict[lang][key] ?? dict.ar[key] ?? key;
};

/** Pick nameAr/nameEn (or descriptionAr/En) for the active language with fallback. */
export function pick(obj: Record<string, any> | null | undefined, field: 'name' | 'description', lang: Lang): string {
  if (!obj) return '';
  const ar = obj[field + 'Ar'];
  const en = obj[field + 'En'];
  return (lang === 'ar' ? ar || en : en || ar) || '';
}

/** Shared bilingual language toggle button group. */
export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} lang="ar">ع</button>
      <button aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
    </div>
  );
}
