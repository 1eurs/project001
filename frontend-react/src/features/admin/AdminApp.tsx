import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, logout } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { omr } from '../../lib/format';
import type { Restaurant, Subscription, SubscriptionStatus, BillingCycle, PendingOnboarding, AdminRestaurantStats } from '../../lib/types';
import { BRAND } from '../../lib/brand';
import Login from '../auth/Login';
import './admin.css';

const DICT: Dict = {
  ar: { restaurants: 'المطاعم', cur: 'ر.ع', logoutT: 'خروج',
        kTotal: 'إجمالي المطاعم', kActive: 'نشِطة', kInactive: 'موقوفة', kNew: 'جديدة هذا الشهر',
        kOrders30: 'طلبات آخر ٣٠ يوم', kRevenue30: 'إيرادات آخر ٣٠ يوم',
        search: 'ابحث بالاسم أو المعرّف…', all: 'الكل', active: 'نشِط', inactive: 'موقوف', newR: '＋ مطعم جديد',
        thName: 'المطعم', thContact: 'التواصل', thVat: 'الضريبة', thStatus: 'الحالة', thCreated: 'الإنشاء',
        thOrders30: 'طلبات ٣٠ يوم', thRevenue30: 'إيراد ٣٠ يوم', thLastOrder: 'آخر طلب',
        activity: 'النشاط', aToday: 'طلبات اليوم', a30d: 'طلبات آخر ٣٠ يوم', aRev30: 'إيرادات آخر ٣٠ يوم (مكتملة)',
        aTotal: 'إجمالي الطلبات', aBranches: 'الفروع', aItems: 'أصناف القائمة', aLast: 'آخر طلب',
        never: 'لا طلبات بعد', justNow: 'الآن', minAgo: 'د', hrAgo: 'س', dayAgo: 'يوم',
        info: 'المعلومات', slug: 'المعرّف', phone: 'الهاتف', email: 'البريد', vat: 'القيمة المضافة', created: 'الإنشاء', currency: 'العملة',
        subscription: 'الاشتراك', plan: 'الخطة', cycle: 'الدورة', price: 'السعر', status: 'الحالة', noSub: 'لا يوجد اشتراك', addSub: 'إضافة اشتراك', editSub: 'تعديل الاشتراك',
        oneTime: 'دفع مرة واحدة', lifetime: 'مدى الحياة',
        endDate: 'ينتهي', renew: 'تجديد', renewed: 'تم التجديد الاشتراك', expired: 'منتهٍ', expiringSoon: 'قريب الانتهاء',
        activate: 'تفعيل', deactivate: 'إيقاف', save: 'حفظ', cancel: 'إلغاء', create: 'إنشاء',
        createT: 'إنشاء مطعم', createP: 'يُنشأ المطعم وحساب المالك (اختياري) معاً.',
        rName: 'اسم المطعم', rSlug: 'المعرّف (slug)', oName: 'اسم المالك', oEmail: 'بريد المالك', oPass: 'كلمة المرور',
        loginTitle: 'منصّة Serva.', loginSub: 'دخول مدير المنصّة', createdOk: 'تم الإنشاء', saved: 'تم الحفظ', enabled: 'مفعّل', disabled: 'متوقف',
        navRestaurants: 'المطاعم', navOnboarding: 'طلبات الاشتراك', onboarding: 'طلبات الاشتراك',
        kPending: 'بانتظار الدفع', thCafe: 'المقهى', thOwner: 'المالك', thAmount: 'المبلغ', thRef: 'المرجع', thActions: 'إجراءات',
        confirmPay: 'تأكيد الدفع', reject: 'رفض', confirmed: 'تم تأكيد الدفع', rejected: 'تم رفض الطلب', noPending: 'لا توجد طلبات بانتظار الدفع',
        rejectConfirm: 'رفض هذا الطلب؟ سيبقى المقهى غير مُفعّل.' },
  en: { restaurants: 'Restaurants', cur: 'OMR', logoutT: 'Logout',
        kTotal: 'Total restaurants', kActive: 'Active', kInactive: 'Inactive', kNew: 'New this month',
        kOrders30: 'Orders · 30 days', kRevenue30: 'Revenue · 30 days',
        search: 'Search name or slug…', all: 'All', active: 'Active', inactive: 'Inactive', newR: '＋ New restaurant',
        thName: 'Restaurant', thContact: 'Contact', thVat: 'VAT', thStatus: 'Status', thCreated: 'Created',
        thOrders30: 'Orders 30d', thRevenue30: 'Revenue 30d', thLastOrder: 'Last order',
        activity: 'Activity', aToday: 'Orders today', a30d: 'Orders · last 30 days', aRev30: 'Revenue · last 30 days (completed)',
        aTotal: 'Orders all-time', aBranches: 'Branches', aItems: 'Menu items', aLast: 'Last order',
        never: 'No orders yet', justNow: 'just now', minAgo: 'm', hrAgo: 'h', dayAgo: 'd',
        info: 'Details', slug: 'Slug', phone: 'Phone', email: 'Email', vat: 'VAT', created: 'Created', currency: 'Currency',
        subscription: 'Subscription', plan: 'Plan', cycle: 'Cycle', price: 'Price', status: 'Status', noSub: 'No subscription', addSub: 'Add subscription', editSub: 'Edit subscription',
        oneTime: 'One-time access', lifetime: 'Lifetime',
        endDate: 'Ends', renew: 'Renew', renewed: 'Subscription renewed', expired: 'Expired', expiringSoon: 'Expiring soon',
        activate: 'Activate', deactivate: 'Deactivate', save: 'Save', cancel: 'Cancel', create: 'Create',
        createT: 'Create restaurant', createP: 'Creates the restaurant and (optionally) the owner account.',
        rName: 'Restaurant name', rSlug: 'Slug', oName: 'Owner name', oEmail: 'Owner email', oPass: 'Password',
        loginTitle: 'Serva. platform', loginSub: 'Platform admin sign-in', createdOk: 'Created', saved: 'Saved', enabled: 'On', disabled: 'Off',
        navRestaurants: 'Restaurants', navOnboarding: 'Onboarding', onboarding: 'Onboarding',
        kPending: 'Awaiting payment', thCafe: 'Café', thOwner: 'Owner', thAmount: 'Amount', thRef: 'Reference', thActions: 'Actions',
        confirmPay: 'Confirm payment', reject: 'Reject', confirmed: 'Payment confirmed', rejected: 'Onboarding rejected', noPending: 'No cafés awaiting payment',
        rejectConfirm: 'Reject this signup? The café stays inactive.' },
};

const SUB_STATUSES: SubscriptionStatus[] = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'];
const CYCLES: BillingCycle[] = ['MONTHLY', 'YEARLY', 'ONE_TIME'];
const subClass = (s?: SubscriptionStatus) => s === 'ACTIVE' ? 'ok' : s === 'TRIAL' ? 'warn' : s === 'PAST_DUE' ? 'bad' : '';
const hue = (id: number) => `hsl(${(id * 67) % 360} 70% 60%)`;

/** Compact relative time for "last order": just now / 12m / 3h / 5d. */
const ago = (iso: string | null | undefined, t: (k: string) => string) => {
  if (!iso) return t('never');
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return `${mins}${t('minAgo')}`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}${t('hrAgo')}`;
  return `${Math.floor(mins / 1440)} ${t('dayAgo')}`;
};
/** Activity pulse: green when ordering today-ish, amber within a week, red/grey beyond. */
const pulseClass = (iso: string | null | undefined) => {
  if (!iso) return '';
  const hrs = (Date.now() - new Date(iso).getTime()) / 3600000;
  return hrs <= 24 ? 'ok' : hrs <= 24 * 7 ? 'warn' : 'bad';
};

export default function AdminApp() {
  const { authed, user } = useAuth();
  const t = useT(DICT);
  if (!authed) return <Login mark={BRAND.name} title={t('loginTitle')} subtitle={t('loginSub')} />;
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />;
  return <AdminInner />;
}

function AdminInner() {
  const { user } = useAuth();
  const t = useT(DICT);
  const { lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<'restaurants' | 'onboarding'>('restaurants');

  const { data: raw } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => api.get<any>('/api/admin/restaurants'),
  });
  const restaurants: Restaurant[] = Array.isArray(raw) ? raw : raw?.content ?? [];

  // Loaded always so the rail badge shows the pending count regardless of the active view.
  const { data: pending } = useQuery({
    queryKey: ['admin-onboarding'],
    queryFn: () => api.get<PendingOnboarding[]>('/api/admin/onboarding'),
  });
  const pendingCount = pending?.length ?? 0;

  // Per-cafe activity (orders, revenue, last order…), one cheap grouped query server-side.
  const { data: statsRaw } = useQuery({
    queryKey: ['admin-restaurant-stats'],
    queryFn: () => api.get<AdminRestaurantStats[]>('/api/admin/restaurants/stats'),
    refetchInterval: 60_000,
  });
  const stats = useMemo(() => new Map((statsRaw ?? []).map((s) => [s.restaurantId, s])), [statsRaw]);

  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [modal, setModal] = useState<'create' | 'sub' | null>(null);

  const kpis = useMemo(() => {
    const now = new Date();
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.active).length;
    const fresh = restaurants.filter((r) => r.createdAt && new Date(r.createdAt).getMonth() === now.getMonth() && new Date(r.createdAt).getFullYear() === now.getFullYear()).length;
    const orders30 = (statsRaw ?? []).reduce((s, x) => s + x.orders30d, 0);
    const revenue30 = (statsRaw ?? []).reduce((s, x) => s + Number(x.revenue30d || 0), 0);
    return { total, active, inactive: total - active, fresh, orders30, revenue30 };
  }, [restaurants, statsRaw]);

  const rows = restaurants
    .filter((r) => filter === 'all' || (filter === 'active' ? r.active : !r.active))
    .filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.slug.includes(query.toLowerCase()));

  const toggleActive = useMutation({
    mutationFn: (r: Restaurant) => api.patch<Restaurant>(`/api/admin/restaurants/${r.id}/${r.active ? 'deactivate' : 'activate'}`),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); setSelected(r); toast(r.active ? t('enabled') : t('disabled')); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const initials = (user?.fullName ?? 'PA').split(' ').map((s) => s[0]).slice(0, 2).join('');

  return (
    <div className="adm">
      <aside className="arail">
        <div className="logo">S.</div>
        <nav className="nav">
          <button className={view === 'restaurants' ? 'on' : ''} title={t('navRestaurants')} onClick={() => setView('restaurants')}>🏪</button>
          <button className={view === 'onboarding' ? 'on' : ''} title={t('navOnboarding')} onClick={() => setView('onboarding')}>
            ⏳{pendingCount > 0 && <span className="nbadge">{pendingCount}</span>}
          </button>
        </nav>
        <button className="out" title={t('logoutT')} onClick={() => logout()}>⏻</button>
      </aside>

      <div className="amain">
        <div className="atop">
          <div><h2>{view === 'onboarding' ? t('onboarding') : t('restaurants')}</h2><div className="crumb">/admin/{view}</div></div>
          <div className="spacer" />
          <div className="who"><div className="av">{initials}</div><div><div className="nm">{user?.fullName}</div><div className="rl">PLATFORM_ADMIN</div></div></div>
        </div>

        <div className="acontent">
          {view === 'onboarding' ? (
            <OnboardingView t={t} />
          ) : (
          <>
          <div className="kpis">
            <Kpi color="var(--accent)" label={t('kTotal')} val={kpis.total} />
            <Kpi color="var(--green)" label={t('kActive')} val={kpis.active} />
            <Kpi color="var(--bad)" label={t('kInactive')} val={kpis.inactive} />
            <Kpi color="var(--blue)" label={t('kNew')} val={kpis.fresh} />
            <Kpi color="var(--amber)" label={t('kOrders30')} val={kpis.orders30} />
            <Kpi color="var(--green)" label={t('kRevenue30')} val={`${omr(kpis.revenue30)} ${t('cur')}`} />
          </div>

          <div className="toolbar">
            <div className="search">🔎<input placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div className="seg">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{t(f)}</button>
              ))}
            </div>
            <div className="spacer" style={{ flex: 1 }} />
            <button className="btn sm" onClick={() => setModal('create')}>{t('newR')}</button>
          </div>

          <table className="tbl">
            <thead><tr>
              <th>{t('thName')}</th><th className="hide-sm">{t('thContact')}</th>
              <th>{t('thOrders30')}</th><th className="hide-sm">{t('thRevenue30')}</th>
              <th>{t('thLastOrder')}</th><th>{t('thStatus')}</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = stats.get(r.id);
                return (
                  <tr key={r.id} onClick={() => setSelected(r)}>
                    <td><div className="rcell"><div className="rlogo" style={{ background: hue(r.id) }}>{r.name.charAt(0)}</div>
                      <div><div className="rname">{r.name}</div><div className="rslug">{r.slug}</div></div></div></td>
                    <td className="hide-sm"><div>{r.phone || '—'}</div><div className="rslug">{r.email || ''}</div></td>
                    <td><span className="num" style={{ fontWeight: 600 }}>{s ? s.orders30d : '—'}</span>
                      {s && s.ordersToday > 0 && <span className="rslug"> · {t('aToday')}: <span className="num">{s.ordersToday}</span></span>}</td>
                    <td className="hide-sm"><span className="num">{s ? `${omr(Number(s.revenue30d))} ${t('cur')}` : '—'}</span></td>
                    <td><span className={'chip ' + pulseClass(s?.lastOrderAt)}><span className="d" />{ago(s?.lastOrderAt, t)}</span></td>
                    <td><span className={'chip ' + (r.active ? 'ok' : '')}><span className="d" />{r.active ? t('active') : t('inactive')}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </>
          )}
        </div>
      </div>

      <div className={'drawer-bg' + (selected ? ' open' : '')} onClick={() => setSelected(null)} />
      <aside className={'drawer' + (selected ? ' open' : '')}>
        {selected && <DrawerBody r={selected} stats={stats.get(selected.id)} onToggle={() => toggleActive.mutate(selected)} onEditSub={() => setModal('sub')} onClose={() => setSelected(null)} />}
      </aside>

      {modal === 'create' && <CreateModal onClose={() => setModal(null)} onDone={() => { qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); setModal(null); toast(t('createdOk')); }} />}
      {modal === 'sub' && selected && <SubModal restaurant={selected} onClose={() => setModal(null)} onDone={() => { qc.invalidateQueries({ queryKey: ['sub', selected.id] }); setModal(null); toast(t('saved')); }} />}
    </div>
  );
}

const Kpi = ({ color, label, val }: { color: string; label: string; val: number | string }) => (
  <div className="kpi"><div className="lab"><span className="ic" style={{ background: color }} />{label}</div><div className="val">{val}</div></div>
);

function OnboardingView({ t }: { t: (k: string) => string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-onboarding'],
    queryFn: () => api.get<PendingOnboarding[]>('/api/admin/onboarding'),
  });
  const rows = data ?? [];

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirm' | 'reject' }) =>
      api.post(`/api/admin/onboarding/${id}/${action}`),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-onboarding'] });
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast(v.action === 'confirm' ? t('confirmed') : t('rejected'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
    onSettled: () => setBusy(null),
  });

  return (
    <>
      <div className="kpis">
        <Kpi color="var(--amber)" label={t('kPending')} val={rows.length} />
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--faint)' }}>{t('noPending')}</div>
      ) : (
        <table className="tbl">
          <thead><tr>
            <th>{t('thCafe')}</th><th className="hide-sm">{t('thOwner')}</th><th className="hide-sm">{t('thRef')}</th>
            <th>{t('thAmount')}</th><th className="hide-sm">{t('thCreated')}</th><th>{t('thActions')}</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.restaurantId}>
                <td><div className="rcell"><div className="rlogo" style={{ background: hue(r.restaurantId) }}>{r.cafeName.charAt(0)}</div>
                  <div><div className="rname">{r.cafeName}</div><div className="rslug">{r.slug}</div></div></div></td>
                <td className="hide-sm"><div>{r.ownerName || '—'}</div><div className="rslug">{r.ownerEmail || ''}</div></td>
                <td className="hide-sm"><span className="num">{r.reference}</span></td>
                <td><span className="num">{omr(r.amount)} {t('cur')}</span></td>
                <td className="hide-sm"><span className="num" style={{ color: 'var(--muted)' }}>{r.createdAt?.slice(0, 10)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm" disabled={act.isPending}
                            onClick={() => { setBusy(r.restaurantId); act.mutate({ id: r.restaurantId, action: 'confirm' }); }}>
                      {busy === r.restaurantId && act.isPending ? '…' : t('confirmPay')}
                    </button>
                    <button className="btn sm danger" disabled={act.isPending}
                            onClick={() => { if (window.confirm(t('rejectConfirm'))) { setBusy(r.restaurantId); act.mutate({ id: r.restaurantId, action: 'reject' }); } }}>
                      {t('reject')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function DrawerBody({ r, stats, onToggle, onEditSub, onClose }: { r: Restaurant; stats?: AdminRestaurantStats; onToggle: () => void; onEditSub: () => void; onClose: () => void }) {
  const t = useT(DICT);
  const qc = useQueryClient();
  const toast = useToast();
  const { data: sub } = useQuery({
    queryKey: ['sub', r.id],
    queryFn: async (): Promise<Subscription | null> => {
      try { return await api.get<Subscription>(`/api/admin/restaurants/${r.id}/subscription`); }
      catch (e) { if (e instanceof ApiError && e.httpStatus === 404) return null; throw e; }
    },
    retry: false,
  });

  const renew = useMutation({
    mutationFn: () => api.post(`/api/admin/onboarding/${r.id}/renew`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub', r.id] });
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast(t('renewed'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const isOneTime = sub?.billingCycle === 'ONE_TIME';
  // Days until the term ends (recurring subs only; lifetime/ONE_TIME should have no end date).
  const daysLeft = sub?.endDate ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000) : null;
  const expiryChip = daysLeft == null ? '' : daysLeft < 0 ? 'bad' : daysLeft <= 14 ? 'warn' : 'ok';
  const expiryLabel = daysLeft == null ? '' : daysLeft < 0 ? t('expired') : daysLeft <= 14 ? t('expiringSoon') : '';

  return (
    <>
      <div className="drawer-hd">
        <div className="rlogo" style={{ background: hue(r.id), width: 42, height: 42, fontSize: 18 }}>{r.name.charAt(0)}</div>
        <div><div style={{ fontWeight: 700, fontSize: 17 }}>{r.name}</div><div className="rslug">{r.slug}</div></div>
        <button className="x" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-bd">
        <div className="sect"><h4>{t('info')}</h4>
          <div className="kv"><span className="k">{t('status')}</span><span className="v"><span className={'chip ' + (r.active ? 'ok' : '')}><span className="d" />{r.active ? t('active') : t('inactive')}</span></span></div>
          <div className="kv"><span className="k">{t('slug')}</span><span className="v num">{r.slug}</span></div>
          <div className="kv"><span className="k">{t('phone')}</span><span className="v num">{r.phone || '—'}</span></div>
          <div className="kv"><span className="k">{t('email')}</span><span className="v">{r.email || '—'}</span></div>
          <div className="kv"><span className="k">{t('currency')}</span><span className="v num">{r.currency}</span></div>
          <div className="kv"><span className="k">{t('vat')}</span><span className="v num">{r.vatEnabled ? `${r.vatRate}%` : '—'}</span></div>
          <div className="kv"><span className="k">{t('created')}</span><span className="v num">{r.createdAt?.slice(0, 10)}</span></div>
        </div>
        <div className="sect"><h4>{t('activity')}</h4>
          {stats ? (
            <>
              <div className="kv"><span className="k">{t('aLast')}</span><span className="v">
                <span className={'chip ' + pulseClass(stats.lastOrderAt)}><span className="d" />{ago(stats.lastOrderAt, t)}</span></span></div>
              <div className="kv"><span className="k">{t('aToday')}</span><span className="v num">{stats.ordersToday}</span></div>
              <div className="kv"><span className="k">{t('a30d')}</span><span className="v num">{stats.orders30d}</span></div>
              <div className="kv"><span className="k">{t('aRev30')}</span><span className="v num">{omr(Number(stats.revenue30d))} {t('cur')}</span></div>
              <div className="kv"><span className="k">{t('aTotal')}</span><span className="v num">{stats.ordersTotal}</span></div>
              <div className="kv"><span className="k">{t('aBranches')}</span><span className="v num">{stats.branches}</span></div>
              <div className="kv"><span className="k">{t('aItems')}</span><span className="v num">{stats.menuItems}</span></div>
            </>
          ) : <div className="subbox" style={{ color: 'var(--faint)', fontSize: 13 }}>{t('never')}</div>}
        </div>
        <div className="sect"><h4>{t('subscription')}</h4>
          {sub ? (
            <div className="subbox">
              <div className="kv"><span className="k">{t('plan')}</span><span className="v">{isOneTime ? t('oneTime') : sub.planName}</span></div>
              <div className="kv"><span className="k">{t('cycle')}</span><span className="v num">{sub.billingCycle}</span></div>
              <div className="kv"><span className="k">{t('price')}</span><span className="v num">{omr(sub.price)} {t('cur')}</span></div>
              <div className="kv"><span className="k">{t('status')}</span><span className="v"><span className={'chip ' + subClass(sub.status)}><span className="d" />{sub.status}</span></span></div>
              {isOneTime && (
                <div className="kv"><span className="k">{t('endDate')}</span><span className="v num">{t('lifetime')}</span></div>
              )}
              {!isOneTime && sub.endDate && (
                <div className="kv"><span className="k">{t('endDate')}</span><span className="v num">
                  {sub.endDate}{expiryLabel && <span className={'chip ' + expiryChip} style={{ marginInlineStart: 8 }}>{expiryLabel}</span>}
                </span></div>
              )}
            </div>
          ) : <div className="subbox" style={{ color: 'var(--faint)', fontSize: 13 }}>{t('noSub')}</div>}
        </div>
      </div>
      <div className="drawer-ft">
        {r.active ? <button className="btn danger" onClick={onToggle}>{t('deactivate')}</button> : <button className="btn" onClick={onToggle}>{t('activate')}</button>}
        {sub && !isOneTime && sub.endDate && <button className="btn" disabled={renew.isPending} onClick={() => renew.mutate()}>{renew.isPending ? '…' : t('renew')}</button>}
        <button className="btn ghost" onClick={onEditSub}>{sub ? t('editSub') : t('addSub')}</button>
      </div>
    </>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT(DICT);
  const toast = useToast();
  const [f, setF] = useState({ name: '', slug: '', oName: '', oEmail: '', oPass: '' });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const r = await api.post<Restaurant>('/api/admin/restaurants', {
        name: f.name, slug: f.slug || undefined, currency: 'OMR', vatEnabled: true, vatRate: 5,
      });
      if (f.oEmail && f.oPass) {
        await api.post('/api/users', {
          fullName: f.oName || f.name, email: f.oEmail, password: f.oPass, role: 'RESTAURANT_OWNER', restaurantId: r.id,
        });
      }
      return r;
    },
    onSuccess: onDone,
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{t('createT')}</h3><div className="ph">{t('createP')}</div>
        <div className="row2">
          <div className="field"><label>{t('rName')}</label><input value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label>{t('rSlug')}</label><input className="num" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="my-cafe" /></div>
        </div>
        <div className="row2">
          <div className="field"><label>{t('oName')}</label><input value={f.oName} onChange={(e) => set('oName', e.target.value)} /></div>
          <div className="field"><label>{t('oEmail')}</label><input className="num" value={f.oEmail} onChange={(e) => set('oEmail', e.target.value)} placeholder="owner@cafe.om" /></div>
        </div>
        <div className="field"><label>{t('oPass')}</label><input className="num" type="password" value={f.oPass} onChange={(e) => set('oPass', e.target.value)} placeholder="min 8 chars" /></div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!f.name || create.isPending} onClick={() => create.mutate()}>{create.isPending ? '…' : t('create')}</button>
        </div>
      </div>
    </div>
  );
}

function SubModal({ restaurant, onClose, onDone }: { restaurant: Restaurant; onClose: () => void; onDone: () => void }) {
  const t = useT(DICT);
  const toast = useToast();
  const { data: existing } = useQuery({
    queryKey: ['sub', restaurant.id],
    queryFn: async (): Promise<Subscription | null> => {
      try { return await api.get<Subscription>(`/api/admin/restaurants/${restaurant.id}/subscription`); }
      catch (e) { if (e instanceof ApiError && e.httpStatus === 404) return null; throw e; }
    },
    retry: false,
  });
  const [f, setF] = useState({ planName: 'Pro', billingCycle: 'MONTHLY' as BillingCycle, price: '25', status: 'ACTIVE' as SubscriptionStatus });
  // hydrate from existing once loaded
  useEffect(() => { if (existing) setF({ planName: existing.planName, billingCycle: existing.billingCycle, price: String(existing.price), status: existing.status }); }, [existing]);
  const setCycle = (billingCycle: BillingCycle) => {
    setF((p) => ({
      ...p,
      billingCycle,
      planName: billingCycle === 'ONE_TIME' && ['Pro', 'Annual'].includes(p.planName) ? 'Lifetime' : p.planName,
      status: billingCycle === 'ONE_TIME' && p.status === 'TRIAL' ? 'ACTIVE' : p.status,
    }));
  };

  const save = useMutation({
    mutationFn: () => {
      const body = { planName: f.planName, billingCycle: f.billingCycle, price: Number(f.price), status: f.status,
        startDate: existing?.startDate ?? new Date().toISOString().slice(0, 10) };
      return existing
        ? api.patch(`/api/admin/subscriptions/${existing.id}`, body)
        : api.post(`/api/admin/restaurants/${restaurant.id}/subscription`, body);
    },
    onSuccess: onDone,
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{existing ? t('editSub') : t('addSub')}</h3><div className="ph">{restaurant.name}</div>
        <div className="row2">
          <div className="field"><label>{t('plan')}</label><input value={f.planName} onChange={(e) => setF({ ...f, planName: e.target.value })} /></div>
          <div className="field"><label>{t('price')} ({t('cur')})</label><input className="num" type="number" step="0.001" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>{t('cycle')}</label><select value={f.billingCycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>{CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="field"><label>{t('status')}</label><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as SubscriptionStatus })}>{SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? '…' : t('save')}</button>
        </div>
      </div>
    </div>
  );
}
