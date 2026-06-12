import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import type { OrderType, PublicMenu, PublicItem, ReturningCustomer } from '../../lib/types';
import { deviceToken } from '../../lib/customerProfile';
import { omr } from '../../lib/format';
import { useI18n, useT, pick, LangToggle, type Dict } from '../../lib/i18n';
import { useCartStore, useCart } from '../../lib/cart';
import { useToast } from '../../lib/toast';
import { useVenue, cartKeyOf, menuUrlOf } from './venue';
import { usePresence } from './usePresence';
import { CustomerFrame } from './CustomerFrame';

const DICT: Dict = {
  ar: { table: 'طاولة', viewCart: 'عرض السلة', items: 'أصناف', cur: 'ر.ع', min: 'د',
        soldout: 'غير متوفر', unavailable: 'القائمة غير متاحة حالياً', retry: 'إعادة المحاولة', takeaway: 'سفري', car: 'خدمة السيارة', added: 'أُضيف ✓',
        welcome: 'أهلاً بعودتك', usual: 'طلبك المعتاد', addUsual: '＋ أضف', reorderLast: '↻ اطلب طلبك السابق', lastAdded: 'أُضيف طلبك السابق إلى السلة ✓' },
  en: { table: 'Table', viewCart: 'View cart', items: 'items', cur: 'OMR', min: 'min',
        soldout: 'Sold out', unavailable: 'Menu is unavailable right now', retry: 'Try again', takeaway: 'Takeaway', car: 'Outdoor car', added: 'Added ✓',
        welcome: 'Welcome back', usual: 'Your usual', addUsual: '＋ Add', reorderLast: '↻ Reorder your last order', lastAdded: 'Your last order is in the cart ✓' },
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
  const location = useLocation();
  const orderType: OrderType = token ? 'DINE_IN' : location.pathname.endsWith('/car') ? 'CAR' : 'TAKEAWAY';

  const url = menuUrlOf(slug, bId, token);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['menu', url],
    queryFn: () => api.get<PublicMenu>(url, { auth: false }),
  });

  const setVenue = useVenue((s) => s.setVenue);
  useEffect(() => {
    if (data) setVenue({ slug, branchId: bId, tableToken: token, orderType, restaurant: data.restaurant, branch: data.branch ?? null, table: data.table ?? null });
  }, [data, orderType]); // eslint-disable-line

  const cartKey = cartKeyOf(slug, bId, token, orderType);
  const cart = useCart(cartKey);
  const { add, bump } = useCartStore();
  const toast = useToast();
  const addItem = (id: number) => { add(cartKey, id); toast(t('added')); };

  // Returning customer (device token exists only after a previous order from this browser).
  const devTok = deviceToken();
  const { data: returning } = useQuery({
    queryKey: ['returning', slug, devTok],
    queryFn: () => api.get<ReturningCustomer | null>(
      `/api/public/restaurants/${encodeURIComponent(slug)}/returning?deviceToken=${encodeURIComponent(devTok!)}`,
      { auth: false }),
    enabled: !!slug && !!devTok,
    staleTime: 5 * 60_000,
  });

  const itemsById = useMemo(() => {
    const m = new Map<number, PublicItem>();
    data?.categories.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
    return m;
  }, [data]);

  // "Your usual": only with a strong repeat signal — ≥2 orders and the top item in ≥50% of them
  // (the repeat/explore threshold that keeps the banner from guessing on thin history).
  const usual = useMemo(() => {
    if (!returning || returning.orderCount < 2) return null;
    return returning.favorites.find((f) =>
      f.ordersContaining * 2 >= returning.orderCount && itemsById.get(f.menuItemId)?.available) ?? null;
  }, [returning, itemsById]);
  const lastItems = useMemo(
    () => (returning?.lastOrder?.items ?? []).filter((i) => itemsById.get(i.menuItemId)?.available),
    [returning, itemsById]);
  const reorderLast = () => {
    lastItems.forEach((i) => {
      add(cartKey, i.menuItemId);
      if (i.quantity > 1) bump(cartKey, i.menuItemId, i.quantity - 1);
    });
    toast(t('lastAdded'));
  };

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + (itemsById.get(l.id)?.price ?? 0) * l.qty, 0);

  // Report live presence: "viewing" while browsing, "ordering" once they've added items —
  // including what's in the cart so the counter can see demand building up.
  usePresence(bId, token ?? (orderType === 'CAR' ? 'car' : 'takeaway'), count > 0,
    cart.map((l) => ({ menuItemId: l.id, quantity: l.qty })));

  // sticky category nav highlight
  const scrollRef = useRef<HTMLDivElement>(null);
  const navButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
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

  useEffect(() => {
    if (activeCat == null) return;
    navButtonsRef.current.get(activeCat)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCat]);

  const gotoCat = (id: number) => document.getElementById('cat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isLoading) return <Frame><div className="center"><div className="spinner" /></div></Frame>;
  if (isError || !data) {
    const msg = error instanceof ApiError ? error.message : t('unavailable');
    return (
      <Frame>
        <div className="empty" style={{ margin: 'auto' }}>
          <div className="big">S.</div>
          <h3>{t('unavailable')}</h3>
          <p>{msg}</p>
          <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => refetch()}>{t('retry')}</button>
        </div>
      </Frame>
    );
  }

  const r = data.restaurant;
  const pickedRestaurantName = pick(r, 'name', lang);
  const restaurantName = pickedRestaurantName || r.name;
  const secondaryRestaurantName = pickedRestaurantName && r.name !== pickedRestaurantName ? r.name : null;
  return (
    <Frame restaurantTheme={data.restaurant.theme} restaurantThemeCustomJson={data.restaurant.themeCustomJson}>
      <header className="c-hdr">
        <div className="c-hdr-top">
          <div className="c-brand">
            <div className={'c-mark' + (r.logoUrl ? ' has-logo' : '')}>
              {r.logoUrl ? <img src={r.logoUrl} alt={restaurantName} /> : restaurantName.charAt(0)}
            </div>
            <div>
              <h1>{restaurantName}</h1>
              {secondaryRestaurantName && <div className="en">{secondaryRestaurantName}</div>}
            </div>
          </div>
          <LangToggle />
        </div>
        <div className="c-meta">
          {data.table
            ? <span className="c-table">🪑 {t('table')} <span className="num">{data.table.tableNumber}</span></span>
            : orderType === 'CAR'
              ? <span className="c-table">🚗 {t('car')}</span>
            : <span className="c-table">🥡 {t('takeaway')}</span>}
          {data.branch && <span>{pick(data.branch, 'name', lang)}</span>}
        </div>
      </header>

      <nav className="c-nav">
        {data.categories.map((c) => (
          <button
            key={c.id}
            ref={(el) => {
              if (el) navButtonsRef.current.set(c.id, el);
              else navButtonsRef.current.delete(c.id);
            }}
            className={activeCat === c.id ? 'on' : ''}
            aria-current={activeCat === c.id ? 'true' : undefined}
            onClick={() => gotoCat(c.id)}
          >
            <span>{pick(c, 'name', lang)}</span>
            <em>{c.items.length}</em>
          </button>
        ))}
      </nav>

      <main className="c-scroll" ref={scrollRef}>
        {(usual || lastItems.length > 0) && (
          <div className="c-usual">
            <h3><span className="wave">👋</span>{t('welcome')}{returning?.customerName ? (lang === 'ar' ? '، ' : ', ') + returning.customerName : ''}</h3>
            <div className="row">
              {usual && (
                <button className="btn-usual" onClick={() => addItem(usual.menuItemId)}>
                  {t('addUsual')} {lang === 'ar' ? (usual.nameAr || usual.nameEn) : (usual.nameEn || usual.nameAr)}
                </button>
              )}
              {lastItems.length > 0 && <button className="btn-last" onClick={reorderLast}>{t('reorderLast')}</button>}
            </div>
          </div>
        )}
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
        <div className="c-bottom-spacer" />
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

function Frame({ children, restaurantTheme, restaurantThemeCustomJson }:
  { children: React.ReactNode; restaurantTheme?: string | null; restaurantThemeCustomJson?: string | null }) {
  const { restaurant } = useVenue();
  return <CustomerFrame restaurantTheme={restaurantTheme ?? restaurant?.theme} restaurantThemeCustomJson={restaurantThemeCustomJson ?? restaurant?.themeCustomJson}>{children}</CustomerFrame>;
}
