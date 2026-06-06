import { useEffect, useState } from 'react';
import type { Lang } from './content';
import L0Counter from './designs/L0Counter';
import L1Velocity from './designs/L1Velocity';
import L2Warmth from './designs/L2Warmth';
import L3Turath from './designs/L3Turath';
import L4Bold from './designs/L4Bold';
import L5Lumen from './designs/L5Lumen';
import L6SkipLine from './designs/L6SkipLine';
import L7Owner from './designs/L7Owner';
import L8Fast from './designs/L8Fast';
import './landing-gallery.css';

const DESIGNS = [
  { id: 1, name: 'Counter', note: 'Funded-grade · restrained, product-led', Comp: L0Counter },
  { id: 2, name: 'Velocity', note: 'Modern dark SaaS · order from car', Comp: L1Velocity },
  { id: 3, name: 'Warmth', note: 'Warm boutique serif · order from car', Comp: L2Warmth },
  { id: 4, name: 'Turath', note: 'Omani heritage · order from car', Comp: L3Turath },
  { id: 5, name: 'Bold', note: 'Neo-brutalist · order from car', Comp: L4Bold },
  { id: 6, name: 'Lumen', note: 'Glass + mesh · order from car', Comp: L5Lumen },
  { id: 7, name: 'SkipLine', note: 'Speed angle · skip the queue', Comp: L6SkipLine },
  { id: 8, name: 'Owner', note: 'B2B angle · tables into checkouts', Comp: L7Owner },
  { id: 9, name: 'Fast', note: 'Setup angle · live in 2 minutes', Comp: L8Fast },
];

export default function LandingGallery() {
  const params = new URLSearchParams(window.location.search);
  const initial = Math.min(9, Math.max(1, Number(params.get('d')) || 1));
  const [idx, setIdx] = useState(initial - 1);
  const [lang, setLang] = useState<Lang>((params.get('lang') as Lang) === 'en' ? 'en' : 'ar');

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('d', String(idx + 1));
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
  }, [idx, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % DESIGNS.length);
      else if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + DESIGNS.length) % DESIGNS.length);
      else if (/^[1-9]$/.test(e.key)) setIdx(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const Current = DESIGNS[idx].Comp;

  return (
    <div className="lz-gallery" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="lz-stage">
        <Current key={idx + lang} lang={lang} />
      </div>

      <div className="lz-switcher" dir="ltr">
        <div className="lz-lang">
          <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <span className="lz-div" />
        <button className="lz-arrow" onClick={() => setIdx((i) => (i - 1 + DESIGNS.length) % DESIGNS.length)} aria-label="Previous">‹</button>
        <div className="lz-tabs">
          {DESIGNS.map((d, i) => (
            <button key={d.id} className={'lz-tab' + (i === idx ? ' on' : '')} onClick={() => setIdx(i)}>
              <span className="lz-tab-n">{d.id}</span><span className="lz-tab-name">{d.name}</span>
            </button>
          ))}
        </div>
        <button className="lz-arrow" onClick={() => setIdx((i) => (i + 1) % DESIGNS.length)} aria-label="Next">›</button>
        <div className="lz-meta"><b>{DESIGNS[idx].name}</b><span>{DESIGNS[idx].note}</span></div>
      </div>
    </div>
  );
}
