import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { KIT_PAGES, PAGE_META, type KitPage } from './data';
import D1Onyx from './designs/D1Onyx';
import D2Daylight from './designs/D2Daylight';
import D3Bento from './designs/D3Bento';
import D4Terminal from './designs/D4Terminal';
import D5Aurora from './designs/D5Aurora';
import D6Espresso from './designs/D6Espresso';
import './gallery.css';

const DESIGNS = [
  { id: 1, name: 'Onyx', note: 'Refined dark SaaS', Comp: D1Onyx },
  { id: 2, name: 'Daylight', note: 'Warm editorial light', Comp: D2Daylight },
  { id: 3, name: 'Bento', note: 'Asymmetric bento grid', Comp: D3Bento },
  { id: 4, name: 'Terminal', note: 'Swiss / mono terminal', Comp: D4Terminal },
  { id: 5, name: 'Aurora', note: 'Vibrant glass + mesh', Comp: D5Aurora },
  { id: 6, name: 'Espresso', note: 'Cozy dark roast', Comp: D6Espresso },
];

export default function DashboardGallery() {
  const { lang } = useI18n();
  const params = new URLSearchParams(window.location.search);
  const initial = Math.min(6, Math.max(1, Number(params.get('d')) || 1));
  const [idx, setIdx] = useState(initial - 1);
  const [page, setPage] = useState<KitPage>(
    KIT_PAGES.includes(params.get('p') as KitPage) ? (params.get('p') as KitPage) : 'overview',
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('d', String(idx + 1));
    url.searchParams.set('p', page);
    window.history.replaceState(null, '', url);
  }, [idx, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % DESIGNS.length);
      else if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + DESIGNS.length) % DESIGNS.length);
      else if (e.key === 'ArrowDown') setPage((p) => KIT_PAGES[(KIT_PAGES.indexOf(p) + 1) % KIT_PAGES.length]);
      else if (e.key === 'ArrowUp') setPage((p) => KIT_PAGES[(KIT_PAGES.indexOf(p) - 1 + KIT_PAGES.length) % KIT_PAGES.length]);
      else if (/^[1-6]$/.test(e.key)) setIdx(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const Current = DESIGNS[idx].Comp;

  return (
    <div className="dz-gallery" dir="ltr">
      <div className="dz-stage" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Current key={idx} page={page} setPage={setPage} />
      </div>

      <div className="dz-pages">
        {KIT_PAGES.map((p) => (
          <button key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>
            <span className="pi">{PAGE_META[p].icon}</span>{PAGE_META[p].en}
          </button>
        ))}
      </div>

      <div className="dz-switcher" role="tablist" aria-label="Dashboard designs">
        <button className="dz-arrow" onClick={() => setIdx((i) => (i - 1 + DESIGNS.length) % DESIGNS.length)} aria-label="Previous">‹</button>
        <div className="dz-tabs">
          {DESIGNS.map((d, i) => (
            <button key={d.id} role="tab" aria-selected={i === idx} className={'dz-tab' + (i === idx ? ' on' : '')} onClick={() => setIdx(i)}>
              <span className="dz-tab-n">{d.id}</span><span className="dz-tab-name">{d.name}</span>
            </button>
          ))}
        </div>
        <button className="dz-arrow" onClick={() => setIdx((i) => (i + 1) % DESIGNS.length)} aria-label="Next">›</button>
        <div className="dz-meta"><b>{DESIGNS[idx].name}</b><span>{DESIGNS[idx].note}</span></div>
      </div>
    </div>
  );
}
