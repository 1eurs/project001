import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../../lib/analytics';
import { discountPercent } from '../../lib/format';
import { Money } from '../../lib/Money';
import { effectiveBasePrice } from '../../lib/cart';
import { useI18n, useT, pick, type Dict } from '../../lib/i18n';
import type { PublicItem, SelectedOption } from '../../lib/types';

const DICT: Dict = {
  ar: { cur: 'ر.ع', add: 'أضف للسلة', from: 'يبدأ من', req: 'يرجى اختيار', choose: 'اختر', optional: 'اختياري',
        qty: 'الكمية', close: 'إغلاق', chooseOne: 'اختر واحداً', chooseAny: 'اختر أي منها', soldout: 'غير متوفر',
        min: 'د', prep: 'وقت التحضير' },
  en: { cur: 'OMR', add: 'Add to cart', from: 'from', req: 'Please choose', choose: 'Choose', optional: 'optional',
        qty: 'Quantity', close: 'Close', chooseOne: 'Choose one', chooseAny: 'Choose any', soldout: 'Sold out',
        min: 'min', prep: 'Prep time' },
};

interface Props {
  item: PublicItem;
  restaurantSlug: string;
  branchId?: number | null;
  qrTableToken?: string | null;
  /** Browse-only menus (no table / not the car route) show item details but no add control. */
  orderable?: boolean;
  onClose: () => void;
  onAdd: (qty: number, options: SelectedOption[]) => void;
}

export function ItemDetailModal({ item, restaurantSlug, branchId, qrTableToken, orderable = true, onClose, onAdd }: Props) {
  const { lang } = useI18n();
  const t = useT(DICT);
  const [qty, setQty] = useState(1);
  // single-group selections: optionId or null; multi-group: set of optionIds
  const [single, setSingle] = useState<Record<number, number | null>>({});
  const [multi, setMulti] = useState<Record<number, Set<number>>>({});
  const sentViewRef = useRef(false);

  // Fire ITEM_VIEW once when the modal opens — feeds the Pro conversion radar + funnel.
  useEffect(() => {
    if (sentViewRef.current) return;
    sentViewRef.current = true;
    track('ITEM_VIEW', { restaurantSlug, branchId, qrTableToken }, { menuItemId: item.id });
  }, [item.id, restaurantSlug, branchId, qrTableToken]);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const groups = item.optionGroups ?? [];
  // Pre-select the first option of optional SINGLE groups so the customer sees a default
  // price and doesn't hit a "required" wall unless the cafe explicitly marked it required.
  useEffect(() => {
    const init: Record<number, number | null> = {};
    for (const g of groups) {
      if (g.selectionType === 'SINGLE' && !g.required && g.options.length) init[g.id] = g.options[0].id;
    }
    setSingle(init);
    setMulti({});
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const selectedOptions = useMemo<SelectedOption[]>(() => {
    const out: SelectedOption[] = [];
    for (const g of groups) {
      if (g.selectionType === 'SINGLE') {
        const optId = single[g.id];
        if (optId != null) out.push({ optionGroupId: g.id, optionId: optId });
      } else {
        for (const optId of multi[g.id] ?? []) out.push({ optionGroupId: g.id, optionId: optId });
      }
    }
    return out;
  }, [groups, single, multi]);

  const unitPrice = useMemo(() => {
    let p = effectiveBasePrice(item); // discounted base when on sale; options stack on top
    for (const sel of selectedOptions) {
      const g = groups.find((x) => x.id === sel.optionGroupId);
      const opt = g?.options.find((o) => o.id === sel.optionId);
      if (opt) p += opt.priceDelta;
    }
    return p;
  }, [item, selectedOptions, groups]);

  const missingRequired = groups.some((g) => g.selectionType === 'SINGLE' && g.required && single[g.id] == null);
  const canAdd = item.available && !missingRequired;
  const lineTotal = unitPrice * qty;

  const setSingleChoice = (groupId: number, optionId: number) =>
    setSingle((s) => ({ ...s, [groupId]: optionId }));
  const toggleMulti = (groupId: number, optionId: number) =>
    setMulti((s) => {
      const cur = new Set(s[groupId] ?? []);
      if (cur.has(optionId)) cur.delete(optionId); else cur.add(optionId);
      return { ...s, [groupId]: cur };
    });

  const submit = () => { if (canAdd) onAdd(qty, selectedOptions); };

  const name = pick(item, 'name', lang);
  const description = pick(item, 'description', lang);
  const photos = item.images?.length ? item.images : (item.imageUrl ? [item.imageUrl] : []);

  return (
    <div className="modal-bg c-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label={name}>
      <div className="c-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="c-modal-x" onClick={onClose} aria-label={t('close')}>×</button>

        <div className="c-modal-scroll">
          {photos.length > 0 ? (
            <div className="c-slider">
              <div className="c-slider-track">
                {photos.map((src, i) => (
                  <div className="c-slider-slide" key={i} style={{ backgroundImage: `url('${src}')` }} />
                ))}
              </div>
              {photos.length > 1 && (
                <div className="c-slider-dots">
                  {photos.map((_, i) => <span key={i} />)}</div>
              )}
            </div>
          ) : (
            <div className="c-slider c-slider-empty">
              <span className="glyph">{name.charAt(0)}</span>
            </div>
          )}

          <div className="c-modal-body">
            <h2 className="c-modal-title">{name}</h2>
            {lang === 'ar' && item.nameEn && item.nameEn !== name && <div className="c-modal-sub">{item.nameEn}</div>}
            {description && <p className="c-modal-desc">{description}</p>}
            <div className="c-modal-pricerow">
              <span className="c-modal-unit">
                {item.salePrice != null && <Money value={item.price} className="c-was num" />}
                <Money value={unitPrice} className={'num' + (item.salePrice != null ? ' c-sale' : '')} />
                {item.salePrice != null && <span className="c-off">−{discountPercent(item.price, item.salePrice)}%</span>}
              </span>
              {item.preparationTimeMinutes ? <span className="c-modal-prep">⏱ {item.preparationTimeMinutes} {t('min')}</span> : null}
            </div>

            {groups.map((g) => (
              <div className="c-opt-group" key={g.id}>
                <div className="c-opt-head">
                  <h3>{pick(g, 'name', lang)}</h3>
                  <span className="c-opt-kind">
                    {g.selectionType === 'SINGLE' ? t('chooseOne') : t('chooseAny')}
                    {g.required ? <em className="req"> · {t('req')}</em> : <em className="opt"> · {t('optional')}</em>}
                  </span>
                </div>
                <div className="c-opt-list">
                  {g.options.map((o) => {
                    const on = g.selectionType === 'SINGLE'
                      ? single[g.id] === o.id
                      : (multi[g.id]?.has(o.id) ?? false);
                    const cls = 'c-opt' + (on ? ' on' : '');
                    return (
                      <button type="button" key={o.id} className={cls}
                        onClick={() => g.selectionType === 'SINGLE' ? setSingleChoice(g.id, o.id) : toggleMulti(g.id, o.id)}
                        aria-pressed={on}>
                        <span className="c-opt-mark">{g.selectionType === 'SINGLE' ? '○' : '☐'}</span>
                        <span className="c-opt-name">{pick(o, 'name', lang)}</span>
                        {o.priceDelta !== 0 && (
                          <Money value={o.priceDelta} className="c-opt-delta" showPlus />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {orderable && (
          <div className="c-modal-foot">
            <div className="c-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="n num">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <button className="btn c-modal-add" disabled={!canAdd} onClick={submit}>
              {!item.available ? t('soldout')
                : missingRequired ? t('choose')
                : <>{t('add')} · <Money value={lineTotal} className="num" /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
