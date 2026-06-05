import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import type { PublicMenu, PublicItem } from '../../lib/types';
import { omr } from '../../lib/format';
import { LangToggle, useI18n, useT, pick, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { useCartStore, useCart } from '../../lib/cart';
import { useToast } from '../../lib/toast';
import { useVenue, cartKeyOf, menuUrlOf } from './venue';
import './customer.css';

const DICT: Dict = {
  ar: { table: 'طاولة', viewCart: 'عرض السلة', items: 'أصناف', cur: 'ر.ع', min: 'د',
        soldout: 'غير متوفر', unavailable: 'القائمة غير متاحة حالياً', retry: 'إعادة المحاولة', takeaway: 'سفري', added: 'أُضيف ✓' },
  en: { table: 'Table', viewCart: 'View cart', items: 'items', cur: 'OMR', min: 'min',
        soldout: 'Sold out', unavailable: 'Menu is unavailable right now', retry: 'Try again', takeaway: 'Takeaway', added: 'Added ✓' },
};

const thumb = (it: PublicItem) => {
  if (it.imageUrl) return { backgroundImage: `url('${it.imageUrl}')` };
  const hue = (it.id * 47) % 360;
  return { backgroundImage: `linear-gradient(155deg, hsl(${hue} 42% 34%) -30%, #15171C 70%)` };
};

export default function MenuPage() {
  const { slug = '', branchId, tableToken } = useParams();
  const bId = branchId ? Number(branchId) : null;
  const token = tableToken ?? null;
  const { lang } = useI18n();
  const t = useT(DICT);
  const nav = useNavigate();

  const url = menuUrlOf(slug, bId, token);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['menu', url],
    queryFn: () => api.get<PublicMenu>(url, { auth: false }),
  });

  const setVenue = useVenue((s) => s.setVenue);
  useEffect(() => {
    if (data) setVenue({ slug, branchId: bId, tableToken: token, restaurant: data.restaurant, branch: data.branch ?? null, table: data.table ?? null });
  }, [data]); // eslint-disable-line

  const cartKey = cartKeyOf(slug, bId, token);
  const cart = useCart(cartKey);
  const { add, bump } = useCartStore();
  const toast = useToast();
  const addItem = (id: number) => { add(cartKey, id); toast(t('added')); };

  const itemsById = useMemo(() => {
    const m = new Map<number, PublicItem>();
    data?.categories.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
    return m;
  }, [data]);

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + (itemsById.get(l.id)?.price ?? 0) * l.qty, 0);

  // sticky category nav highlight
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !data) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActiveCat(Number((e.target as HTMLElement).dataset.cat)); }),
      { root, rootMargin: '-10% 0px -75% 0px' },
    );
    data.categories.forEach((c) => { const el = document.getElementById('cat-' + c.id); if (el) io.observe(el); });
    setActiveCat(data.categories[0]?.id ?? null);
    return () => io.disconnect();
  }, [data]);

  const gotoCat = (id: number) => document.getElementById('cat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isLoading) return <Frame><div className="center"><div className="spinner" /></div></Frame>;
  if (isError || !data) {
    const msg = error instanceof ApiError ? error.message : t('unavailable');
    return (
      <Frame>
        <div className="empty" style={{ margin: 'auto' }}>
          <div className="big">☕</div>
          <h3>{t('unavailable')}</h3>
          <p>{msg}</p>
          <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => refetch()}>{t('retry')}</button>
        </div>
      </Frame>
    );
  }

  const r = data.restaurant;
  return (
    <Frame>
      <header className="c-hdr">
        <div className="c-hdr-top">
          <div className="c-brand">
            <div className="c-mark">{pick(r, 'name', lang).charAt(0)}</div>
            <div>
              <h1>{pick(r, 'name', lang)}</h1>
              {lang === 'ar' && <div className="en">{r.name}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ThemeToggle /><LangToggle /></div>
        </div>
        <div className="c-meta">
          {data.table
            ? <span className="c-table">🪑 {t('table')} <span className="num">{data.table.tableNumber}</span></span>
            : <span className="c-table">🥡 {t('takeaway')}</span>}
          {data.branch && <><span className="dot" /><span>{pick(data.branch, 'name', lang)}</span></>}
        </div>
      </header>

      <nav className="c-nav">
        {data.categories.map((c) => (
          <button key={c.id} className={activeCat === c.id ? 'on' : ''} onClick={() => gotoCat(c.id)}>
            {pick(c, 'name', lang)}
          </button>
        ))}
      </nav>

      <main className="c-scroll" ref={scrollRef}>
        {data.categories.map((c) => (
          <section className="c-cat" id={'cat-' + c.id} data-cat={c.id} key={c.id}>
            <div className="c-cat-head">
              <h2>{pick(c, 'name', lang)}</h2>
              <span className="c-rule" />
              {lang === 'ar' && <span className="en">{c.nameEn}</span>}
            </div>
            {pick(c, 'description', lang) && <p className="c-cat-desc">{pick(c, 'description', lang)}</p>}
            {c.items.map((it, idx) => {
              const line = cart.find((l) => l.id === it.id);
              return (
                <article className={'c-item' + (it.available ? '' : ' out')} style={{ animationDelay: `${idx * 60}ms` }} key={it.id}>
                  <div className="c-thumb" style={thumb(it)}>
                    {!it.imageUrl && <span className="glyph">{pick(it, 'name', lang).charAt(0)}</span>}
                  </div>
                  {!it.available && <span className="c-badge">{t('soldout')}</span>}
                  <div className="c-body">
                    <h3>{pick(it, 'name', lang)}</h3>
                    {lang === 'ar' && it.nameEn && <div className="sub">{it.nameEn}</div>}
                    {pick(it, 'description', lang) && <p>{pick(it, 'description', lang)}</p>}
                    <div className="c-foot">
                      <div>
                        <div className="c-price"><span className="num">{omr(it.price)}</span><span className="cur">{t('cur')}</span></div>
                        {it.preparationTimeMinutes ? <div className="c-prep">⏱ <span className="num">{it.preparationTimeMinutes}</span> {t('min')}</div> : null}
                      </div>
                      {!it.available
                        ? <button className="c-add" disabled>+</button>
                        : line
                          ? <div className="c-qty">
                              <button onClick={() => add(cartKey, it.id)}>+</button>
                              <span className="n num">{line.qty}</span>
                              <button onClick={() => bump(cartKey, it.id, -1)}>−</button>
                            </div>
                          : <button className="c-add" onClick={() => addItem(it.id)} aria-label="add">+</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
        <div style={{ height: 90 }} />
      </main>

      <div className={'c-cartbar' + (count > 0 ? ' show' : '')} onClick={() => nav('/cart')}>
        <div className="ico">🛒<span className="count">{count}</span></div>
        <div className="lbl"><b>{t('viewCart')}</b><span>{count} {t('items')}</span></div>
        <div className="total"><span className="num">{omr(subtotal)}</span></div>
        <div className="go">‹</div>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="cust-bg"><div className="phone">{children}</div></div>;
}
