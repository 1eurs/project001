import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import type { PublicMenu, PublicItem, OrderTracking, CreateOrderPayload, OrderType } from '../../lib/types';
import { omr, estimateVat } from '../../lib/format';
import { useI18n, useT, pick, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { useCartStore, useCart } from '../../lib/cart';
import { useVenue, cartKeyOf, menuUrlOf } from './venue';
import './customer.css';

const DICT: Dict = {
  ar: { title: 'سلّتك', cur: 'ر.ع', empty: 'سلّتك فارغة', emptySub: 'أضف ما يطيب لك من القائمة.', back: 'العودة للقائمة',
        whoFor: 'نوع الطلب', dineIn: 'تناول هنا', takeaway: 'سفري', name: 'الاسم (اختياري)', phone: 'الجوال (اختياري)',
        note: 'ملاحظة على الطلب', notePh: 'مثال: بدون سكر…', itemNote: 'ملاحظة على الصنف…',
        subtotal: 'المجموع الفرعي', vat: 'ضريبة القيمة المضافة', total: 'الإجمالي',
        finalNote: 'يُحتسب الإجمالي النهائي من المقهى عند تأكيد الطلب.', place: 'إرسال الطلب', placing: 'جارٍ الإرسال…' },
  en: { title: 'Your cart', cur: 'OMR', empty: 'Your cart is empty', emptySub: 'Add something you love from the menu.', back: 'Back to menu',
        whoFor: 'Order type', dineIn: 'Dine-in', takeaway: 'Takeaway', name: 'Name (optional)', phone: 'Phone (optional)',
        note: 'Order note', notePh: 'e.g. no sugar…', itemNote: 'Note for this item…',
        subtotal: 'Subtotal', vat: 'VAT', total: 'Total',
        finalNote: 'Final total is confirmed by the cafe when your order is accepted.', place: 'Place order', placing: 'Sending…' },
};

const thumb = (it: PublicItem) => it.imageUrl
  ? { backgroundImage: `url('${it.imageUrl}')` }
  : { backgroundImage: `linear-gradient(155deg, hsl(${(it.id * 47) % 360} 42% 34%) -30%, #15171C 70%)` };

export default function CartPage() {
  const { lang } = useI18n();
  const t = useT(DICT);
  const nav = useNavigate();
  const toast = useToast();
  const { slug, branchId, tableToken, restaurant } = useVenue();

  const menuPath = tableToken ? `/r/${slug}/b/${branchId}/t/${tableToken}` : branchId != null ? `/r/${slug}/b/${branchId}` : `/r/${slug}`;
  const cartKey = cartKeyOf(slug, branchId, tableToken);
  const cart = useCart(cartKey);
  const { bump, setNote, clear } = useCartStore();

  const { data } = useQuery({
    queryKey: ['menu', slug ? menuUrlOf(slug, branchId, tableToken) : 'none'],
    queryFn: () => api.get<PublicMenu>(menuUrlOf(slug!, branchId, tableToken), { auth: false }),
    enabled: !!slug,
  });
  const itemsById = useMemo(() => {
    const m = new Map<number, PublicItem>();
    data?.categories.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
    return m;
  }, [data]);

  const [orderType, setOrderType] = useState<OrderType>(tableToken ? 'DINE_IN' : 'TAKEAWAY');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setOrderNote] = useState('');

  const subtotal = cart.reduce((s, l) => s + (itemsById.get(l.id)?.price ?? 0) * l.qty, 0);
  const vatEnabled = restaurant?.vatEnabled ?? false;
  const vat = estimateVat(subtotal, restaurant?.vatRate ?? 0, vatEnabled);
  const total = subtotal + vat;

  const place = useMutation({
    mutationFn: () => {
      const payload: CreateOrderPayload = {
        restaurantSlug: slug!, branchId: branchId!, tableToken: orderType === 'DINE_IN' ? tableToken : null,
        orderType, customerName: name || null, customerPhone: phone || null, customerNote: note || null,
        items: cart.map((l) => ({ menuItemId: l.id, quantity: l.qty, note: l.note || null })),
      };
      return api.post<OrderTracking>('/api/public/orders', payload, { auth: false });
    },
    onSuccess: (order) => {
      clear(cartKey);
      localStorage.setItem('cafeqr_lastOrder', order.trackingToken);
      nav(`/order/${order.trackingToken}`);
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  return (
    <div className="cust-bg"><div className="phone">
      <header className="c-vhdr">
        <button className="c-back" onClick={() => nav(menuPath)} aria-label="back"><span className="arr">›</span></button>
        <h2>{t('title')}</h2>
      </header>

      {cart.length === 0 ? (
        <div className="c-vbody"><div className="empty" style={{ margin: 'auto' }}>
          <div className="big">☕</div><h3>{t('empty')}</h3><p>{t('emptySub')}</p>
          <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => nav(menuPath)}>{t('back')}</button>
        </div></div>
      ) : (
        <>
          <div className="c-vbody">
            {cart.map((l) => {
              const it = itemsById.get(l.id);
              if (!it) return null;
              return (
                <div className="c-line" key={l.id}>
                  <div className="c-thumb" style={thumb(it)}>{!it.imageUrl && <span className="glyph">{pick(it, 'name', lang).charAt(0)}</span>}</div>
                  <div className="c-line-main">
                    <h4>{pick(it, 'name', lang)}</h4>
                    <div className="lp"><span className="num">{omr(it.price)}</span> {t('cur')}</div>
                    <textarea className="c-notein" rows={1} placeholder={t('itemNote')} value={l.note}
                      onChange={(e) => setNote(cartKey, l.id, e.target.value)} />
                  </div>
                  <div className="c-line-side">
                    <div className="c-qty">
                      <button onClick={() => useCartStore.getState().add(cartKey, l.id)}>+</button>
                      <span className="n num">{l.qty}</span>
                      <button onClick={() => bump(cartKey, l.id, -1)}>−</button>
                    </div>
                    <div className="lt"><span className="num">{omr(it.price * l.qty)}</span></div>
                  </div>
                </div>
              );
            })}

            {tableToken && (
              <div className="field" style={{ marginTop: 18 }}>
                <label>{t('whoFor')}</label>
                <div className="c-seg">
                  <button className={orderType === 'DINE_IN' ? 'on' : ''} onClick={() => setOrderType('DINE_IN')}>🪑 {t('dineIn')}</button>
                  <button className={orderType === 'TAKEAWAY' ? 'on' : ''} onClick={() => setOrderType('TAKEAWAY')}>🥡 {t('takeaway')}</button>
                </div>
              </div>
            )}
            <div className="field"><label>{t('name')}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="…" /></div>
            <div className="field"><label>{t('phone')}</label><input className="num" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XXXXXXX" /></div>
            <div className="field"><label>{t('note')}</label><textarea rows={2} value={note} onChange={(e) => setOrderNote(e.target.value)} placeholder={t('notePh')} /></div>

            <div className="c-totals">
              <div className="row"><span>{t('subtotal')}</span><span className="num">{omr(subtotal)} {t('cur')}</span></div>
              {vatEnabled && <div className="row"><span>{t('vat')} ({restaurant?.vatRate}%)</span><span className="num">{omr(vat)} {t('cur')}</span></div>}
              <div className="row grand"><span>{t('total')}</span><span className="num">{omr(total)} {t('cur')}</span></div>
              <div className="c-hint">{t('finalNote')}</div>
            </div>
          </div>

          <div className="c-foot-bar">
            <button className="btn full" disabled={place.isPending} onClick={() => place.mutate()}>
              {place.isPending ? t('placing') : <>{t('place')} · <span className="num">{omr(total)}</span></>}
            </button>
          </div>
        </>
      )}
    </div></div>
  );
}
