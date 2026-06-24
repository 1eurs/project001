import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
import type { Lang } from '../../lib/types';
import { COMPANY, LEGAL_LABELS, LEGAL_ORDER } from './legal';

/* Shared footer for the marketing + legal pages. Holds the legal links, the
   business details an Omani site must display (CR / contact / address / OMR),
   and the AR/EN toggle (kept at the bottom of every page). Dark surface to
   anchor the light, green-themed pages above it. */

const F: Record<Lang, {
  tagline: string; product: string; legal: string; company: string;
  cr: string; vat: string; made: string; rights: string;
  links: { features: string; how: string; pricing: string; faq: string };
}> = {
  en: {
    tagline: 'Your whole operation, one platform.',
    product: 'Product', legal: 'Legal', company: 'Company',
    cr: 'CR No.', vat: 'All prices in OMR.', made: 'Built in Oman',
    rights: 'All rights reserved.',
    links: { features: 'Features', how: 'How it works', pricing: 'Pricing', faq: 'FAQ' },
  },
  ar: {
    tagline: 'عملك بالكامل، في منصّة واحدة.',
    product: 'المنتج', legal: 'قانوني', company: 'الشركة',
    cr: 'سجل تجاري', vat: 'جميع الأسعار بالريال العُماني.', made: 'صُنع في عُمان',
    rights: 'جميع الحقوق محفوظة.',
    links: { features: 'المميزات', how: 'كيف تعمل', pricing: 'الأسعار', faq: 'الأسئلة' },
  },
};

export function SiteFooter() {
  const { lang } = useI18n();
  const f = F[lang];
  const product = [
    { href: '/#features', label: f.links.features },
    { href: '/#how', label: f.links.how },
    { href: '/#pricing', label: f.links.pricing },
    { href: '/#faq', label: f.links.faq },
  ];

  return (
    <footer className="border-t-4 border-neo-accent bg-neo-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div>
            <div className="flex items-center text-3xl font-black tracking-tighter">
              <span className="flex h-12 items-center border-4 border-white bg-neo-accent px-3 text-black">SERVA</span>
            </div>
            <p className="mt-4 max-w-xs text-base font-bold text-white/80">{f.tagline}</p>
          </div>

          {/* product links */}
          <nav aria-label={f.product}>
            <h3 className="text-xs font-black uppercase tracking-widest text-neo-accent">{f.product}</h3>
            <ul className="mt-4 space-y-2.5">
              {product.map((p) => (
                <li key={p.href}>
                  <a href={p.href} className="text-sm font-bold text-white/85 transition-colors duration-100 hover:text-neo-accent">{p.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* legal links */}
          <nav aria-label={f.legal}>
            <h3 className="text-xs font-black uppercase tracking-widest text-neo-accent">{f.legal}</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_ORDER.map((slug) => (
                <li key={slug}>
                  <Link to={`/legal/${slug}`} className="text-sm font-bold text-white/85 transition-colors duration-100 hover:text-neo-accent">
                    {LEGAL_LABELS[lang][slug]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* business details (required for an Omani online business) */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-neo-accent">{f.company}</h3>
            <ul className="mt-4 space-y-1.5 text-sm font-medium text-white/75">
              <li className="font-bold text-white/90">{COMPANY.legalName[lang]}</li>
              <li>{f.cr} {COMPANY.cr}</li>
              <li>{COMPANY.address[lang]}</li>
              <li><a href={`mailto:${COMPANY.email}`} className="hover:text-neo-accent">{COMPANY.email}</a></li>
              <li dir="ltr" className="text-start">{COMPANY.phoneIntl}</li>
              <li className="pt-1 text-xs font-bold uppercase tracking-wide text-white/55">{f.vat}</li>
            </ul>
          </div>
        </div>

        {/* bottom bar: copyright · made-in-oman · LANGUAGE TOGGLE */}
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t-4 border-white/15 pt-6 sm:flex-row sm:items-center">
          <span className="text-sm font-black uppercase tracking-widest text-white/70">
            © {new Date().getFullYear()} {COMPANY.brand}. {f.rights}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 border-4 border-white/20 px-3 py-1.5 text-xs font-black uppercase tracking-widest">
              <span aria-hidden="true" className="text-neo-accent">★</span> {f.made}
            </span>
            <FooterLangSwitch />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* AR/EN toggle, styled for the dark footer */
function FooterLangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex border-4 border-white/25" role="group" aria-label="Language">
      <button onClick={() => setLang('ar')} aria-pressed={lang === 'ar'} lang="ar"
        className={`px-3 py-1.5 text-sm font-black transition-colors duration-100 ${lang === 'ar' ? 'bg-neo-accent text-black' : 'text-white hover:bg-white/10'}`}>ع</button>
      <button onClick={() => setLang('en')} aria-pressed={lang === 'en'} lang="en"
        className={`border-s-4 border-white/25 px-3 py-1.5 text-sm font-black transition-colors duration-100 ${lang === 'en' ? 'bg-neo-accent text-black' : 'text-white hover:bg-white/10'}`}>EN</button>
    </div>
  );
}
