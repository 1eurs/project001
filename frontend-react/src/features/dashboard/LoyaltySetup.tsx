import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { isProPlan, isPlanRequiredError } from '../../lib/plan';
import type { LoyaltyProgram, MenuItemResponse, Restaurant } from '../../lib/types';

const DICT: Dict = {
  ar: {
    sub: 'كافئ العملاء تلقائياً: ختم مع كل طلب، ومكافأة عند اكتمال البطاقة.',
    rewardTitle: 'تفاصيل المكافأة', rewardSub: 'اختر الصنف المجاني والنص الذي يظهر للعميل.',
    rulesTitle: 'قواعد جمع الأختام', rulesSub: 'حدّد عدد الطلبات والحد الأدنى المؤهّل.',
    preview: 'معاينة بطاقة العميل', previewEmpty: 'مكافأتك القادمة',
    proTitle: 'الولاء ميزة Pro', proSub: 'رقِّ إلى باقة Pro لتشغيل بطاقة الأختام ومكافأة العملاء.',
    program: 'بطاقة الأختام', on: 'مُفعّل', off: 'متوقّف',
    onSub: 'يحصل العملاء على ختم مع كل طلب مؤهّل', offSub: 'الولاء متوقّف — لا يمكن جمع الأختام أو استبدالها',
    turnOn: 'تفعيل', turnOff: 'إيقاف',
    cancel: 'إلغاء', offConfirm: 'سيوقف ذلك جمع العملاء للأختام واستبدال المكافآت. يمكنك إعادة التفعيل في أي وقت.',
    rewardItem: 'الصنف المجاني', none: '— اختر صنفاً —',
    stamps: 'عدد الأختام', rewardLabel: 'نص المكافأة للعميل', rewardLabelPh: 'مثال: قهوة مجانية',
    minOrder: 'الحد الأدنى للطلب لكسب ختم (اختياري)',
    minOrderHint: 'لا تُحتسب الأختام للطلبات أقل من هذا المبلغ. اتركه فارغاً بلا حدّ.',
    ruleHint: 'يحصل العميل على الصنف المجاني بعد كل', orders: 'طلبات.',
    save: 'حفظ التغييرات', saved: 'تم الحفظ', proNeeded: 'هذه الميزة ضمن باقة Pro.',
  },
  en: {
    sub: 'Reward customers automatically: a stamp on every order, a reward when the card is full.',
    rewardTitle: 'Reward details', rewardSub: 'Choose the free item and the message customers will see.',
    rulesTitle: 'Earning rules', rulesSub: 'Set the number of orders and optional qualifying total.',
    preview: 'Customer card preview', previewEmpty: 'Your next reward',
    proTitle: 'Loyalty is a Pro feature', proSub: 'Upgrade to Pro to run a stamp card and reward your regulars.',
    program: 'Stamp card', on: 'Enabled', off: 'Disabled',
    onSub: 'Customers earn a stamp on every qualifying order', offSub: 'Loyalty is paused — stamps cannot be earned or redeemed',
    turnOn: 'Turn on', turnOff: 'Turn off',
    cancel: 'Cancel', offConfirm: 'This will stop customers from earning stamps and redeeming rewards. You can turn it back on anytime.',
    rewardItem: 'Free reward item', none: '— Pick an item —',
    stamps: 'Stamps to earn it', rewardLabel: 'Reward text shown to customers', rewardLabelPh: 'e.g. Free coffee',
    minOrder: 'Minimum order to earn a stamp (optional)',
    minOrderHint: 'Orders below this total will not earn a stamp. Leave empty for no limit.',
    ruleHint: 'Customers get the free item after every', orders: 'orders.',
    save: 'Save changes', saved: 'Saved', proNeeded: 'This feature is part of the Pro plan.',
  },
};

export default function LoyaltySetup() {
  const { user } = useAuth();
  const rid = user!.restaurantId!;
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const restaurantQ = useQuery({ queryKey: ['restaurant', rid], queryFn: () => api.get<Restaurant>(`/api/restaurants/${rid}`) });
  const pro = isProPlan(restaurantQ.data?.plan);

  const programQ = useQuery({ queryKey: ['loyalty-program', rid], queryFn: () => api.get<LoyaltyProgram>('/api/loyalty/program'), enabled: pro });
  const itemsQ = useQuery({ queryKey: ['menu-items', rid], queryFn: () => api.get<MenuItemResponse[]>(`/api/menu/items?restaurantId=${rid}`), enabled: pro });

  const [form, setForm] = useState({ enabled: false, stampsRequired: '8', rewardLabel: '', rewardItemId: '', minOrderAmount: '' });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    const p = programQ.data;
    if (!p) return;
    setForm({
      enabled: p.enabled,
      stampsRequired: String(p.stampsRequired || 8),
      rewardLabel: p.rewardLabel ?? '',
      rewardItemId: p.rewardItemId != null ? String(p.rewardItemId) : '',
      minOrderAmount: p.minOrderAmount != null ? String(p.minOrderAmount) : '',
    });
  }, [programQ.data]);

  const save = useMutation({
    mutationFn: () => api.patch<LoyaltyProgram>('/api/loyalty/program', {
      enabled: form.enabled,
      stampsRequired: Number(form.stampsRequired) || 1,
      rewardLabel: form.rewardLabel.trim(),
      rewardItemId: form.rewardItemId ? Number(form.rewardItemId) : null,
      minOrderAmount: form.minOrderAmount.trim() ? Number(form.minOrderAmount) : null,
    }),
    onSuccess: (p) => { qc.setQueryData(['loyalty-program', rid], p); toast(t('saved')); },
    onError: (e) => toast(isPlanRequiredError(e) ? t('proNeeded') : (e instanceof ApiError ? e.message : 'Error')),
  });

  const items = itemsQ.data ?? [];
  const itemName = (it: MenuItemResponse) => (lang === 'ar' ? (it.nameAr || it.nameEn) : (it.nameEn || it.nameAr));
  const canSave = !!form.rewardLabel.trim() && (!form.enabled || !!form.rewardItemId);
  const stampCount = Math.max(1, Math.min(12, Number(form.stampsRequired) || 1));

  if (restaurantQ.isLoading) {
    return <div className="tables-wrap"><div className="center"><div className="spinner" /></div></div>;
  }
  if (!pro) {
    return (
      <div className="tables-wrap">
        <div className="empty" style={{ marginTop: 56 }}>
          <div className="big">🎟️</div>
          <h3>{t('proTitle')}</h3>
          <p>{t('proSub')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tables-wrap loy-page loy-setup-page">
      <div className="loy-setup-frame">
        <header className="loy-setup-hero">
          <div className="loy-setup-identity">
            <div className="loy-ticket-mark" aria-hidden="true">🎟</div>
            <div>
              <div className={'loy-program-state' + (form.enabled ? ' on' : '')}><span />{form.enabled ? t('on') : t('off')}</div>
              <h3>{t('program')}</h3>
              <p>{t('sub')}</p>
            </div>
          </div>
          <button className="btn" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>{t('save')}</button>
        </header>

        <div className="loy-setup-layout">
          <main className="loy-setup-main">
            <section className="loy-config-section">
              <div className="loy-config-head">
                <span>01</span>
                <div><h4>{t('rewardTitle')}</h4><p>{t('rewardSub')}</p></div>
              </div>
              <div className="loy-config-fields">
                <label className="field loy-reward-item">
                  <span>{t('rewardItem')}</span>
                  <select className="input" value={form.rewardItemId} onChange={(e) => set('rewardItemId', e.target.value)}>
                    <option value="">{t('none')}</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{itemName(it)}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>{t('rewardLabel')}</span>
                  <input value={form.rewardLabel} placeholder={t('rewardLabelPh')} maxLength={120} onChange={(e) => set('rewardLabel', e.target.value)} />
                </label>
              </div>
            </section>

            <section className="loy-config-section">
              <div className="loy-config-head">
                <span>02</span>
                <div><h4>{t('rulesTitle')}</h4><p>{t('rulesSub')}</p></div>
              </div>
              <div className="loy-config-fields">
                <label className="field">
                  <span>{t('stamps')}</span>
                  <input className="num" type="number" min="1" max="50" value={form.stampsRequired} onChange={(e) => set('stampsRequired', e.target.value)} />
                </label>
                <label className="field">
                  <span>{t('minOrder')}</span>
                  <input className="num" type="number" min="0" step="0.001" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} />
                  <small className="loy-hint">{t('minOrderHint')}</small>
                </label>
              </div>
              <p className="loy-rule">{t('ruleHint')} <b className="num">{Math.max(1, Number(form.stampsRequired) || 1)}</b> {t('orders')}</p>
            </section>
          </main>

          <aside className="loy-setup-aside">
            <button type="button" className={'loy-status ' + (form.enabled ? 'on' : 'off')}
              role="switch" aria-checked={form.enabled} onClick={async () => {
                if (form.enabled && !await confirm({
                  danger: true, title: t('turnOff'), message: t('offConfirm'),
                  confirmLabel: t('turnOff'), cancelLabel: t('cancel'),
                })) return;
                set('enabled', !form.enabled);
              }}>
              <span className="loy-status-dot" aria-hidden="true" />
              <span className="loy-status-main">
                <b>{form.enabled ? t('on') : t('off')}</b>
                <span>{form.enabled ? t('onSub') : t('offSub')}</span>
              </span>
              <span className="loy-status-act">{form.enabled ? t('turnOff') : t('turnOn')}</span>
            </button>

            <section className="loy-card-preview">
              <span className="loy-preview-label">{t('preview')}</span>
              <div className="loy-preview-ticket">
                <div className="loy-preview-top"><span>Serva.</span><b>{form.rewardLabel.trim() || t('previewEmpty')}</b></div>
                <div className="loy-preview-stamps" aria-hidden="true">
                  {Array.from({ length: stampCount }).map((_, i) => <i key={i}>{i === 0 ? '★' : ''}</i>)}
                </div>
                <p>{t('ruleHint')} <b className="num">{Math.max(1, Number(form.stampsRequired) || 1)}</b> {t('orders')}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
