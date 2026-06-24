import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { isProPlan, isPlanRequiredError } from '../../lib/plan';
import type { LoyaltyProgram, LoyaltyMemberRow, MenuItemResponse, Restaurant } from '../../lib/types';

const DICT: Dict = {
  ar: {
    sub: 'كافئ العملاء تلقائياً: ختم مع كل طلب، ومكافأة عند اكتمال البطاقة.',
    proTitle: 'الولاء ميزة Pro', proSub: 'رقِّ إلى باقة Pro لتشغيل بطاقة الأختام ومكافأة العملاء.',
    program: 'بطاقة الأختام', on: 'مُفعّل', off: 'متوقّف',
    rewardItem: 'الصنف المجاني', none: '— اختر صنفاً —',
    stamps: 'عدد الأختام', rewardLabel: 'نص المكافأة للعميل', rewardLabelPh: 'مثال: قهوة مجانية',
    minOrder: 'حد أدنى للطلب (اختياري)',
    ruleHint: 'يحصل العميل على الصنف المجاني بعد كل', orders: 'طلبات.',
    save: 'حفظ التغييرات', saved: 'تم الحفظ', proNeeded: 'هذه الميزة ضمن باقة Pro.',
    members: 'الأعضاء', noMembers: 'لا أعضاء بعد — سيظهرون هنا بمجرد جمع العملاء لأختامهم.', search: 'بحث بالاسم أو الجوال', noMatch: 'لا نتائج',
    stMembers: 'عضو', stReady: 'مكافأة متاحة', stRedeemed: 'مكافأة مستبدلة',
    cphone: 'الجوال', cname: 'الاسم', cstamps: 'الأختام', crewards: 'متاحة', clifetime: 'الإجمالي', credeemed: 'مستبدلة',
  },
  en: {
    sub: 'Reward customers automatically: a stamp on every order, a reward when the card is full.',
    proTitle: 'Loyalty is a Pro feature', proSub: 'Upgrade to Pro to run a stamp card and reward your regulars.',
    program: 'Stamp card', on: 'On', off: 'Off',
    rewardItem: 'Free reward item', none: '— Pick an item —',
    stamps: 'Stamps to earn it', rewardLabel: 'Reward text shown to customers', rewardLabelPh: 'e.g. Free coffee',
    minOrder: 'Minimum order (optional)',
    ruleHint: 'Customers get the free item after every', orders: 'orders.',
    save: 'Save changes', saved: 'Saved', proNeeded: 'This feature is part of the Pro plan.',
    members: 'Members', noMembers: 'No members yet — they’ll appear here once customers start collecting stamps.', search: 'Search name or phone', noMatch: 'No matches',
    stMembers: 'members', stReady: 'rewards available', stRedeemed: 'redeemed',
    cphone: 'Phone', cname: 'Name', cstamps: 'Stamps', crewards: 'Available', clifetime: 'Lifetime', credeemed: 'Redeemed',
  },
};

export default function LoyaltyPage() {
  const { user } = useAuth();
  const rid = user!.restaurantId!;
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();

  const restaurantQ = useQuery({ queryKey: ['restaurant', rid], queryFn: () => api.get<Restaurant>(`/api/restaurants/${rid}`) });
  const pro = isProPlan(restaurantQ.data?.plan);

  const programQ = useQuery({ queryKey: ['loyalty-program', rid], queryFn: () => api.get<LoyaltyProgram>('/api/loyalty/program'), enabled: pro });
  const itemsQ = useQuery({ queryKey: ['menu-items', rid], queryFn: () => api.get<MenuItemResponse[]>(`/api/menu/items?restaurantId=${rid}`), enabled: pro });
  const membersQ = useQuery({ queryKey: ['loyalty-members', rid], queryFn: () => api.get<LoyaltyMemberRow[]>('/api/loyalty/members'), enabled: pro });

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
  const members = membersQ.data ?? [];
  const itemName = (it: MenuItemResponse) => (lang === 'ar' ? (it.nameAr || it.nameEn) : (it.nameEn || it.nameAr));
  const canSave = !!form.rewardLabel.trim() && (!form.enabled || !!form.rewardItemId);

  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) => m.phone.toLowerCase().includes(needle) || (m.name ?? '').toLowerCase().includes(needle));
  }, [members, q]);
  const stats = useMemo(() => ({
    members: members.length,
    ready: members.reduce((s, m) => s + m.availableRewards, 0),
    redeemed: members.reduce((s, m) => s + m.rewardsRedeemed, 0),
  }), [members]);

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
    <div className="tables-wrap loy-page">
      <section className="loy-set">
        <header className="loy-set-hd">
          <div>
            <h3>{t('program')}</h3>
            <p>{t('sub')}</p>
          </div>
          <label className="loy-toggle" title={form.enabled ? t('on') : t('off')}>
            <input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
            <span className="sw" aria-hidden="true" />
            <span className="lbl">{form.enabled ? t('on') : t('off')}</span>
          </label>
        </header>

        <div className="loy-fields">
          <label className="field">
            <span>{t('rewardItem')}</span>
            <select className="input" value={form.rewardItemId} onChange={(e) => set('rewardItemId', e.target.value)}>
              <option value="">{t('none')}</option>
              {items.map((it) => <option key={it.id} value={it.id}>{itemName(it)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('stamps')}</span>
            <input className="num" type="number" min="1" max="50" value={form.stampsRequired} onChange={(e) => set('stampsRequired', e.target.value)} />
          </label>
          <label className="field">
            <span>{t('rewardLabel')}</span>
            <input value={form.rewardLabel} placeholder={t('rewardLabelPh')} maxLength={120} onChange={(e) => set('rewardLabel', e.target.value)} />
          </label>
          <label className="field">
            <span>{t('minOrder')}</span>
            <input className="num" type="number" min="0" step="0.001" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} />
          </label>
          <p className="loy-rule">{t('ruleHint')} <b className="num">{Math.max(1, Number(form.stampsRequired) || 1)}</b> {t('orders')}</p>
        </div>

        <div className="loy-set-foot">
          <button className="btn" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>{t('save')}</button>
        </div>
      </section>

      <section className="loy-people">
        <div className="loy-people-hd">
          <h3>{t('members')}</h3>
          {members.length > 0 && (
            <div className="loy-figs">
              <span><b className="num">{stats.members}</b> {t('stMembers')}</span>
              <span><b className="num">{stats.ready}</b> {t('stReady')}</span>
              <span><b className="num">{stats.redeemed}</b> {t('stRedeemed')}</span>
            </div>
          )}
        </div>

        {membersQ.isLoading ? (
          <div className="center"><div className="spinner" /></div>
        ) : members.length === 0 ? (
          <div className="empty"><div className="big">👥</div><p>{t('noMembers')}</p></div>
        ) : (
          <>
            <input className="loy-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} />
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('cphone')}</th><th>{t('cname')}</th><th>{t('cstamps')}</th>
                  <th>{t('crewards')}</th><th>{t('clifetime')}</th><th>{t('credeemed')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.phone}>
                    <td className="num" dir="ltr">{m.phone}</td>
                    <td>{m.name || '—'}</td>
                    <td className="num">{m.stamps}{programQ.data ? ` / ${programQ.data.stampsRequired}` : ''}</td>
                    <td className="num">{m.availableRewards || '—'}</td>
                    <td className="num">{m.lifetimeStamps}</td>
                    <td className="num">{m.rewardsRedeemed}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="loy-nomatch">{t('noMatch')}</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
