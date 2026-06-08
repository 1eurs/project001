import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import type { PublicMenu, PublicItem, OrderTracking, CreateOrderPayload, OrderType } from '../../lib/types';
import { omr, estimateVat } from '../../lib/format';
import { useI18n, useT, pick, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { useCartStore, useCart } from '../../lib/cart';
import { CAR_COLORS } from '../../lib/carColors';
import { useVenue, cartKeyOf, menuPathOf, menuUrlOf } from './venue';
import { usePresence } from './usePresence';
import { CustomerFrame } from './CustomerFrame';

const DICT: Dict = {
  ar: { title: 'سلّتك', cur: 'ر.ع', empty: 'سلّتك فارغة', emptySub: 'أضف ما يطيب لك من القائمة.', back: 'العودة للقائمة',
        carPlate: 'رقم لوحة السيارة العُمانية', carPlatePh: 'مثال: 1234 أ ب', carPlateRequired: 'أدخل رقم لوحة السيارة',
        carPlateHint: 'اكتب الأرقام ثم الرمز', plateNum: 'الأرقام', plateCode: 'الرمز', carColor: 'لون السيارة',
        name: 'الاسم (اختياري)', phone: 'الجوال (اختياري)',
        note: 'ملاحظة على الطلب', notePh: 'مثال: بدون سكر…', itemNote: 'ملاحظة على الصنف…',
        subtotal: 'المجموع الفرعي', vat: 'ضريبة القيمة المضافة', total: 'الإجمالي',
        finalNote: 'يُحتسب الإجمالي النهائي من المقهى عند تأكيد الطلب.', place: 'إرسال الطلب', placing: 'جارٍ الإرسال…' },
  en: { title: 'Your cart', cur: 'OMR', empty: 'Your cart is empty', emptySub: 'Add something you love from the menu.', back: 'Back to menu',
        carPlate: 'Oman car plate', carPlatePh: 'e.g. 1234 AB', carPlateRequired: 'Enter the car plate',
        carPlateHint: 'Numbers, then the letter code', plateNum: 'Numbers', plateCode: 'Code', carColor: 'Car color',
        name: 'Name (optional)', phone: 'Phone (optional)',
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
  const { slug, branchId, tableToken, orderType: venueOrderType, restaurant } = useVenue();
  const orderType: OrderType = tableToken ? 'DINE_IN' : venueOrderType === 'CAR' ? 'CAR' : 'TAKEAWAY';

  // At checkout they're firmly "ordering".
  usePresence(branchId, tableToken ?? (orderType === 'CAR' ? 'car' : 'takeaway'), true);

  const menuPath = menuPathOf(slug, branchId, tableToken, orderType);
  const cartKey = cartKeyOf(slug, branchId, tableToken, orderType);
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plateNum, setPlateNum] = useState('');   // digits, e.g. 1234
  const [plateCode, setPlateCode] = useState(''); // letter code, e.g. أ ب
  const carPlate = `${plateNum} ${plateCode}`.replace(/\s+/g, ' ').trim();
  const [carColor, setCarColor] = useState(''); // palette key, e.g. white
  const [note, setOrderNote] = useState('');

  const subtotal = cart.reduce((s, l) => s + (itemsById.get(l.id)?.price ?? 0) * l.qty, 0);
  const vatEnabled = restaurant?.vatEnabled ?? false;
  const vat = estimateVat(subtotal, restaurant?.vatRate ?? 0, vatEnabled);
  const total = subtotal + vat;

  const place = useMutation({
    mutationFn: () => {
      const normalizedPlate = carPlate.trim().replace(/\s+/g, ' ').toUpperCase();
      const payload: CreateOrderPayload = {
        restaurantSlug: slug!, branchId: branchId!, tableToken: orderType === 'DINE_IN' ? tableToken : null,
        orderType, customerName: name || null, customerPhone: phone || null,
        carPlate: orderType === 'CAR' ? normalizedPlate : null,
        carColor: orderType === 'CAR' ? (carColor || null) : null, customerNote: note || null,
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
  const missingCarPlate = orderType === 'CAR' && !plateNum.trim();
  const submit = () => {
    if (missingCarPlate) {
      toast(t('carPlateRequired'));
      return;
    }
    place.mutate();
  };

  return (
    <CustomerFrame>
      <header className="c-vhdr">
        <button className="c-back" onClick={() => nav(menuPath)} aria-label="back"><span className="arr">›</span></button>
        <h2>{t('title')}</h2>
      </header>

      {cart.length === 0 ? (
        <div className="c-vbody"><div className="empty" style={{ margin: 'auto' }}>
          <div className="big">S.</div><h3>{t('empty')}</h3><p>{t('emptySub')}</p>
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

            {orderType === 'CAR' && (
              <>
                <div className="plate-field" style={{ marginTop: 18 }}>
                  <div className="oman-plate">
                    <div className="oman-plate-hd">
                      <span className="op-flag">🇴🇲</span>
                      <span className="op-ar">سلطنة عُمان</span>
                      <span className="op-en">Sultanate of Oman</span>
                    </div>
                    <div className="oman-plate-bd">
                      <input className="op-num" inputMode="numeric" value={plateNum} aria-label={t('plateNum')}
                        maxLength={5} placeholder="1234"
                        onChange={(e) => setPlateNum(e.target.value.replace(/[^0-9٠-٩]/g, '').slice(0, 5))} />
                      <span className="op-div" />
                      <input className="op-code" inputMode="text" autoCapitalize="characters" value={plateCode} aria-label={t('plateCode')}
                        maxLength={5} placeholder="أ ب"
                        onChange={(e) => setPlateCode(e.target.value.replace(/[^A-Za-z؀-ۿ ]/g, '').replace(/\s+/g, ' ').toUpperCase().slice(0, 5))} />
                    </div>
                  </div>
                  <p className="plate-hint">{t('carPlateHint')}</p>
                </div>

                <div className="field">
                  <label>{t('carColor')}</label>
                  <div className="car-colors">
                    {CAR_COLORS.map((c) => (
                      <button type="button" key={c.key}
                        className={'car-sw' + (carColor === c.key ? ' on' : '') + (c.ring ? ' light' : '')}
                        style={{ ['--sw' as any]: c.hex }}
                        aria-pressed={carColor === c.key} aria-label={lang === 'ar' ? c.ar : c.en}
                        title={lang === 'ar' ? c.ar : c.en}
                        onClick={() => setCarColor((v) => (v === c.key ? '' : c.key))}>
                        <span className="dot" />
                        <span className="nm">{lang === 'ar' ? c.ar : c.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
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
            <button className="btn full" disabled={place.isPending || missingCarPlate} onClick={submit}>
              {place.isPending ? t('placing') : <>{t('place')} · <span className="num">{omr(total)}</span></>}
            </button>
          </div>
        </>
      )}
    </CustomerFrame>
  );
}
