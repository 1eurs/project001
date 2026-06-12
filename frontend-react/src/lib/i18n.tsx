// Lightweight i18n: a provider that tracks language + document direction, plus
// helpers to translate a local dictionary and to pick the right bilingual field.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './types';

interface I18nValue { lang: Lang; dir: 'rtl' | 'ltr'; setLang: (l: Lang) => void; toggle: () => void; }
const Ctx = createContext<I18nValue>({ lang: 'ar', dir: 'rtl', setLang: () => {}, toggle: () => {} });
const LANG_KEY = 'cafeqr_lang';
const LANG_MANUAL_KEY = 'cafeqr_lang_manual';

function isLang(value: string | null): value is Lang {
  return value === 'ar' || value === 'en';
}

function deviceLang(): Lang {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l.toLowerCase().startsWith('ar')) ? 'ar' : 'en';
}

function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  const manual = localStorage.getItem(LANG_MANUAL_KEY) === '1';
  return manual && isLang(saved) ? saved : deviceLang();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    localStorage.setItem(LANG_MANUAL_KEY, '1');
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  };
  const toggle = () => {
    setLangState((p) => {
      const next = p === 'ar' ? 'en' : 'ar';
      localStorage.setItem(LANG_MANUAL_KEY, '1');
      localStorage.setItem(LANG_KEY, next);
      return next;
    });
  };
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
