import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, changeEmail, logout, updateProfile } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { omr } from '../../lib/format';
import type { Restaurant, Subscription, SubscriptionStatus, BillingCycle, BranchResponse, AdminRestaurantStats, Plan, PricingPlan, CategoryResponse, MenuItemResponse } from '../../lib/types';
import { IMPORT_SAMPLE, parseImport, normalizeGroups, type ImpCat } from '../../lib/menuImport';
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
        premiumLook: 'الثيم المتقدّم', premiumOn: 'مُفعّل', premiumOff: 'عادي', premiumEnable: '✦ تفعيل الثيم المتقدّم', premiumDisable: 'إيقاف الثيم المتقدّم',
        createT: 'إنشاء مطعم', createP: 'يُنشأ المطعم مع فرع وحساب المالك (اختياري) والاشتراك.',
        rName: 'اسم المطعم', rSlug: 'المعرّف (slug)', rPlan: 'الخطة', rBranch: 'اسم الفرع الأول', rPlanStd: 'قياسي', rPlanPro: 'Pro', rPlanEnt: 'Enterprise',
        oName: 'اسم المالك', oEmail: 'بريد المالك', oPass: 'كلمة المرور',
        loginTitle: 'منصّة Serva.', loginSub: 'دخول مدير المنصّة', createdOk: 'تم الإنشاء', saved: 'تم الحفظ', enabled: 'مفعّل', disabled: 'متوقف',
        planLabel: 'الخطة',
        branches: 'الفروع', branchesAdd: '＋ فرع', branchName: 'اسم الفرع', branchAddr: 'العنوان', branchPhone: 'الهاتف',
        branchAddOk: 'تم إنشاء الفرع', branchAdding: 'جارٍ…', noBranches: 'لا فروع بعد', deactivateBranch: 'إيقاف', activateBranch: 'تفعيل',
        profile: 'الملف الشخصي', editProfile: 'تعديل الملف الشخصي', editProfileSub: 'غيّر اسمك ورقم هاتفك على حساب المنصّة.',
        fullName: 'الاسم الكامل', profileSaved: 'تم حفظ الملف الشخصي',
        language: 'اللغة', arabic: 'العربية', english: 'English',
        changePassword: 'تغيير كلمة المرور', changeEmail: 'تغيير البريد الإلكتروني',
        changePwSub: 'أدخل كلمة المرور الحالية ثم الجديدة.', changeEmailSub: 'أدخل كلمة المرور الحالية والبريد الجديد.',
        currentPw: 'كلمة المرور الحالية', newPw: 'كلمة المرور الجديدة', confirmPw: 'تأكيد كلمة المرور', newEmail: 'البريد الجديد',
        pwChanged: 'تم تغيير كلمة المرور', pwTooShort: 'كلمة المرور 8 أحرف على الأقل', pwMismatch: 'كلمتا المرور غير متطابقتين',
        emailChanged: 'تم تغيير البريد الإلكتروني', emailInvalid: 'أدخل بريدًا صحيحًا', role_PLATFORM_ADMIN: 'مشرف المنصة',
        navRestaurants: 'المطاعم', navPlans: 'الخطط',
        plansTitle: 'خطط الأسعار', plansSub: 'عدّل سعر كل فئة. الفئة هي ما يحدّد ميزات المطعم. الأسعار بالريال العماني.',
        colTier: 'الفئة', colName: 'الاسم', colMonthly: 'شهري', colSetup: 'رسوم التأسيس', colStatus: 'الحالة', colUnlocks: 'يتضمّن',
        edit: 'تعديل', planNamePh: 'الاسم المعروض', planSaved: 'تم حفظ الخطة',
        perMo: '/شهر', planOn: 'مفعّلة', planOff: 'مخفية', custom: 'مخصّص', choosePlan: 'اختر الفئة', setupShort: 'تأسيس',
        tierStdDesc: 'لوحة التحكم الأساسية', tierProDesc: '+ التحليلات المتقدّمة', tierEntDesc: '+ محجوزة / اتفاقية خدمة',
        menuSect: 'القائمة', importMenu: '⇪ استيراد قائمة (JSON)', importTitle: 'استيراد القائمة (JSON)',
        importHint: 'الصق القائمة كاملةً بصيغة JSON (أقسام وأصناف). الصور تُضاف يدوياً لاحقاً. سيستبدل هذا قائمة المطعم الحالية بالكامل.',
        importPlace: 'الصق JSON هنا…', importSample: 'إدراج نموذج', importReview: 'مراجعة', importBad: 'JSON غير صالح',
        importWarn: 'سيُحذف كل ما في قائمة هذا المطعم الآن ثم يُستبدل بما في الـ JSON. لا يمكن التراجع.',
        willDelete: 'سيُحذف', willAdd: 'سيُضاف', importConfirm: 'استبدال القائمة', importing: 'جارٍ الاستيراد…',
        importDoneT: 'تم الاستيراد', importErrorsT: 'أخطاء', closeBtn: 'إغلاق', catsWord: 'أقسام', itemsWord: 'أصناف' },
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
        premiumLook: 'Premium look', premiumOn: 'On', premiumOff: 'Standard', premiumEnable: '✦ Enable premium look', premiumDisable: 'Disable premium look',
        createT: 'Create restaurant', createP: 'Creates the restaurant, a first branch, an optional owner account, and a trial subscription in one go.',
        rName: 'Restaurant name', rSlug: 'Slug', rPlan: 'Plan', rBranch: 'First branch name', rPlanStd: 'Standard', rPlanPro: 'Pro', rPlanEnt: 'Enterprise',
        oName: 'Owner name', oEmail: 'Owner email', oPass: 'Password',
        loginTitle: 'Serva. platform', loginSub: 'Platform admin sign-in', createdOk: 'Created', saved: 'Saved', enabled: 'On', disabled: 'Off',
        planLabel: 'Plan',
        branches: 'Branches', branchesAdd: '＋ Branch', branchName: 'Name', branchAddr: 'Address', branchPhone: 'Phone',
        branchAddOk: 'Branch created', branchAdding: '…', noBranches: 'No branches yet', deactivateBranch: 'Deactivate', activateBranch: 'Activate',
        profile: 'Profile', editProfile: 'Edit profile', editProfileSub: 'Update your name and phone on the platform account.',
        fullName: 'Full name', profileSaved: 'Profile saved',
        language: 'Language', arabic: 'Arabic', english: 'English',
        changePassword: 'Change password', changeEmail: 'Change email',
        changePwSub: 'Enter your current password, then a new one.', changeEmailSub: 'Enter your current password and new email.',
        currentPw: 'Current password', newPw: 'New password', confirmPw: 'Confirm new password', newEmail: 'New email',
        pwChanged: 'Password changed', pwTooShort: 'Use at least 8 characters', pwMismatch: 'Passwords don’t match',
        emailChanged: 'Email changed', emailInvalid: 'Enter a valid email', role_PLATFORM_ADMIN: 'Platform admin',
        navRestaurants: 'Restaurants', navPlans: 'Plans',
        plansTitle: 'Pricing plans', plansSub: 'Edit each tier’s pricing. The tier is what decides a café’s features. Prices are in OMR.',
        colTier: 'Tier', colName: 'Name', colMonthly: 'Monthly', colSetup: 'Setup fee', colStatus: 'Status', colUnlocks: 'Unlocks',
        edit: 'Edit', planNamePh: 'Display name', planSaved: 'Plan saved',
        perMo: '/mo', planOn: 'Active', planOff: 'Hidden', custom: 'Custom', choosePlan: 'Choose tier', setupShort: 'setup',
        tierStdDesc: 'Core dashboard', tierProDesc: '+ Full analytics', tierEntDesc: '+ Reserved / SLA',
        menuSect: 'Menu', importMenu: '⇪ Import menu (JSON)', importTitle: 'Import menu (JSON)',
        importHint: 'Paste a full menu as JSON (categories & items). Photos are added manually later. This replaces this café’s whole current menu.',
        importPlace: 'Paste JSON here…', importSample: 'Insert sample', importReview: 'Review', importBad: 'Invalid JSON',
        importWarn: 'Everything in this café’s menu is deleted, then replaced with the JSON. This cannot be undone.',
        willDelete: 'Will delete', willAdd: 'Will add', importConfirm: 'Replace menu', importing: 'Importing…',
        importDoneT: 'Import complete', importErrorsT: 'Errors', closeBtn: 'Close', catsWord: 'categories', itemsWord: 'items' },
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
  if (!user?.permissions?.includes('PLATFORM_ADMIN')) return <Navigate to="/dashboard" replace />;
  return <AdminInner />;
}

function AdminInner() {
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: raw } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => api.get<any>('/api/admin/restaurants'),
  });
  const restaurants: Restaurant[] = Array.isArray(raw) ? raw : raw?.content ?? [];

  // Per-cafe activity (orders, revenue, last order…), one cheap grouped query server-side.
  const { data: statsRaw } = useQuery({
    queryKey: ['admin-restaurant-stats'],
    queryFn: () => api.get<AdminRestaurantStats[]>('/api/admin/restaurants/stats'),
    refetchInterval: 60_000,
  });
  const stats = useMemo(() => new Map((statsRaw ?? []).map((s) => [s.restaurantId, s])), [statsRaw]);

  const [view, setView] = useState<'restaurants' | 'plans'>('restaurants');
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

  return (
    <div className="adm">
      <aside className="arail">
        <div className="logo">S.</div>
        <nav className="nav">
          <button className={view === 'restaurants' ? 'on' : ''} title={t('navRestaurants')} onClick={() => setView('restaurants')}>🏪</button>
          <button className={view === 'plans' ? 'on' : ''} title={t('navPlans')} onClick={() => setView('plans')}>💳</button>
        </nav>
        <button className="out" title={t('logoutT')} onClick={() => logout()}>⏻</button>
      </aside>

      <div className="amain">
        <div className="atop">
          <div><h2>{view === 'plans' ? t('plansTitle') : t('restaurants')}</h2><div className="crumb">/admin{view === 'plans' ? '/plans' : ''}</div></div>
          <div className="spacer" />
          <AdminAccountMenu t={t} />
        </div>

        {view === 'plans' ? <PlansView t={t} /> : (
        <div className="acontent">
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
        </div>
        )}
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

function AdminAccountMenu({ t }: { t: (k: string) => string }) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = (user?.fullName ?? 'PA').split(' ').map((s) => s[0]).slice(0, 2).join('');
  const roleLabel = t('role_PLATFORM_ADMIN');

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="who" ref={ref}>
      <button className="who-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <div className="av">{initials}</div>
        <div className="who-txt"><div className="nm">{user?.fullName}</div><div className="rl">{roleLabel}</div></div>
        <span className="who-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-head">
            <div className="av lg">{initials}</div>
            <div className="acct-id">
              <div className="acct-name">{user?.fullName}</div>
              <div className="acct-mail" title={user?.email ?? user?.username}>{user?.email ?? user?.username}</div>
              <span className="acct-role">{roleLabel}</span>
            </div>
          </div>
          <div className="acct-sep" />
          <button className="acct-item" role="menuitem" onClick={() => { setOpen(false); setProfileOpen(true); }}>
            <span className="ai-ic">👤</span>{t('editProfile')}
          </button>
          <button className="acct-item" role="menuitem" onClick={() => { setOpen(false); setPwOpen(true); }}>
            <span className="ai-ic">🔒</span>{t('changePassword')}
          </button>
          <button className="acct-item" role="menuitem" onClick={() => { setOpen(false); setEmailOpen(true); }}>
            <span className="ai-ic">@</span>{t('changeEmail')}
          </button>
          <div className="acct-sep" />
          <div className="acct-lang" role="group" aria-label={t('language')}>
            <span>{t('language')}</span>
            <div className="acct-lang-btns">
              <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>{t('arabic')}</button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>{t('english')}</button>
            </div>
          </div>
          <button className="acct-item danger" role="menuitem" onClick={() => logout()}>
            <span className="ai-ic">⏻</span>{t('logoutT')}
          </button>
        </div>
      )}
      {profileOpen && <EditProfileModal t={t} onClose={() => setProfileOpen(false)} />}
      {pwOpen && <ChangePasswordModal t={t} onClose={() => setPwOpen(false)} />}
      {emailOpen && <ChangeEmailModal t={t} onClose={() => setEmailOpen(false)} />}
    </div>
  );
}

function EditProfileModal({ t, onClose }: { t: (k: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user!.fullName);
  const [phone, setPhone] = useState(user!.phone ?? '');
  const name = fullName.trim();
  const phoneValue = phone.trim();

  const save = useMutation({
    mutationFn: () => updateProfile(name, phoneValue || null),
    onSuccess: () => { toast(t('profileSaved')); onClose(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const unchanged = name === user!.fullName && phoneValue === (user!.phone ?? '');
  const canSave = name.length > 0 && !unchanged && !save.isPending;

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{t('editProfile')}</h3>
        <div className="ph">{t('editProfileSub')}</div>
        <div className="pwform">
          <input className="input" autoComplete="name" placeholder={t('fullName')}
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="input num" autoComplete="tel" placeholder={t('phone')}
            value={phone} onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) save.mutate(); }} />
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!canSave} onClick={() => save.mutate()}>{save.isPending ? '…' : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ t, onClose }: { t: (k: string) => string; onClose: () => void }) {
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const change = useMutation({
    mutationFn: () => api.post('/api/auth/change-password', { currentPassword: cur, newPassword: next }),
    onSuccess: () => { toast(t('pwChanged')); onClose(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSave = !!cur && next.length >= 8 && next === confirm && !change.isPending;

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{t('changePassword')}</h3>
        <div className="ph">{t('changePwSub')}</div>
        <div className="pwform">
          <input className="input" type="password" autoComplete="current-password" placeholder={t('currentPw')}
            value={cur} onChange={(e) => setCur(e.target.value)} />
          <input className="input" type="password" autoComplete="new-password" placeholder={t('newPw')}
            value={next} onChange={(e) => setNext(e.target.value)} />
          {tooShort && <div className="pwhint bad">{t('pwTooShort')}</div>}
          <input className="input" type="password" autoComplete="new-password" placeholder={t('confirmPw')}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) change.mutate(); }} />
          {mismatch && <div className="pwhint bad">{t('pwMismatch')}</div>}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!canSave} onClick={() => change.mutate()}>{change.isPending ? '…' : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function ChangeEmailModal({ t, onClose }: { t: (k: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState(user!.email ?? '');
  const email = next.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const change = useMutation({
    mutationFn: () => changeEmail(cur, email),
    onSuccess: () => { toast(t('emailChanged')); onClose(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const invalid = email.length > 0 && !validEmail;
  const unchanged = email.toLowerCase() === (user!.email ?? '').toLowerCase();
  const canSave = !!cur && validEmail && !unchanged && !change.isPending;

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{t('changeEmail')}</h3>
        <div className="ph">{t('changeEmailSub')}</div>
        <div className="pwform">
          <input className="input" type="password" autoComplete="current-password" placeholder={t('currentPw')}
            value={cur} onChange={(e) => setCur(e.target.value)} />
          <input className="input" type="email" autoComplete="username" placeholder={t('newEmail')}
            value={next} onChange={(e) => setNext(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) change.mutate(); }} />
          {invalid && <div className="pwhint bad">{t('emailInvalid')}</div>}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!canSave} onClick={() => change.mutate()}>{change.isPending ? '…' : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

const Kpi = ({ color, label, val }: { color: string; label: string; val: number | string }) => (
  <div className="kpi"><div className="lab"><span className="ic" style={{ background: color }} />{label}</div><div className="val">{val}</div></div>
);


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
  const { data: branchesRaw, refetch: refetchBranches } = useQuery({
    queryKey: ['admin-branches', r.id],
    queryFn: () => api.get<any>(`/api/restaurants/${r.id}/branches`),
    retry: false,
  });
  const branches: BranchResponse[] = (branchesRaw ?? []) as BranchResponse[];
  const [bName, setBName] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const renew = useMutation({
    mutationFn: () => api.post(`/api/admin/restaurants/${r.id}/renew`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub', r.id] });
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast(t('renewed'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  // Plan toggle: cycle STANDARD → PRO → ENTERPRISE on each click, persisted to the backend.
  const setPlan = useMutation({
    mutationFn: (plan: Plan) => api.patch<Restaurant>(`/api/admin/restaurants/${r.id}/plan?plan=${plan}`),
    onSuccess: (updated) => { qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); toast(updated.plan ?? '…'); setSelectedHelper(updated); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  // setPlan's onSuccess can't reach the parent's `setSelected` directly — instead invalidate and read latest.
  const setSelectedHelper = (_updated: Restaurant) => { qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); };

  const addBranch = useMutation({
    mutationFn: () => api.post<BranchResponse>(`/api/restaurants/${r.id}/branches`, { name: bName || r.name }),
    onSuccess: () => { setBName(''); qc.invalidateQueries({ queryKey: ['admin-branches', r.id] }); qc.invalidateQueries({ queryKey: ['admin-restaurant-stats'] }); toast(t('branchAddOk')); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  const toggleBranch = useMutation({
    mutationFn: (b: BranchResponse) => api.patch<BranchResponse>(`/api/branches/${b.id}/${b.active ? 'deactivate' : 'activate'}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-branches', r.id] }); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const cyclePlan = () => {
    const order: Plan[] = ['STANDARD', 'PRO', 'ENTERPRISE'];
    const next = order[(order.indexOf((r.plan ?? 'PRO') as Plan) + 1) % order.length];
    setPlan.mutate(next);
  };
  const planLabel = (p?: Plan | null) => p === 'STANDARD' ? t('rPlanStd')
    : p === 'PRO' ? t('rPlanPro') : p === 'ENTERPRISE' ? t('rPlanEnt') : t('rPlanPro');

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
          <div className="kv"><span className="k">{t('planLabel')}</span><span className="v">
            <button className={'chip plan ' + (r.plan === 'PRO' ? 'ok' : r.plan === 'ENTERPRISE' ? 'ent' : '')}
                    onClick={cyclePlan} disabled={setPlan.isPending} title={t('rPlan')}>
              <span className="d" />{planLabel(r.plan)}
            </button>
          </span></div>
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
        <div className="sect">
          <h4>{t('branches')}<span className="sect-count">{branches.length}</span></h4>
          <div className="branch-list">
            {branches.length === 0 && <div className="subbox" style={{ color: 'var(--faint)', fontSize: 13 }}>{t('noBranches')}</div>}
            {branches.map((b) => (
              <div className="branch-row" key={b.id}>
                <div className="b-info"><div className="b-name">{b.name}</div>
                  {b.address && <div className="rslug">{b.address}{b.phone ? ' · ' + b.phone : ''}</div>}</div>
                <button className={'chip btn-chip ' + (b.active ? 'ok' : '')} onClick={() => toggleBranch.mutate(b)} title={b.active ? t('deactivateBranch') : t('activateBranch')}>
                  <span className="d" />{b.active ? t('active') : t('inactive')}
                </button>
              </div>
            ))}
          </div>
          <div className="branch-add">
            <input placeholder={t('branchName')} value={bName}
              onChange={(e) => setBName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !addBranch.isPending) addBranch.mutate(); }} />
            <button className="btn sm" disabled={addBranch.isPending} onClick={() => addBranch.mutate()}>
              {addBranch.isPending ? t('branchAdding') : t('branchesAdd')}
            </button>
          </div>
        </div>
        <div className="sect"><h4>{t('menuSect')}</h4>
          <div className="subbox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{stats ? `${stats.menuItems} ${t('itemsWord')}` : ''}</span>
            <button className="btn sm" onClick={() => setImportOpen(true)}>{t('importMenu')}</button>
          </div>
        </div>
      </div>
      <div className="drawer-ft">
        {r.active ? <button className="btn danger" onClick={onToggle}>{t('deactivate')}</button> : <button className="btn" onClick={onToggle}>{t('activate')}</button>}
        {sub && !isOneTime && sub.endDate && <button className="btn" disabled={renew.isPending} onClick={() => renew.mutate()}>{renew.isPending ? '…' : t('renew')}</button>}
        <button className="btn ghost" onClick={onEditSub}>{sub ? t('editSub') : t('addSub')}</button>
      </div>
      {importOpen && <MenuImportModal restaurantId={r.id} restaurantName={r.name} onClose={() => setImportOpen(false)} />}
    </>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT(DICT);
  const toast = useToast();
  const [f, setF] = useState({ name: '', slug: '', plan: 'PRO' as Plan, branch: '', oName: '', oEmail: '', oPass: '' });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const r = await api.post<Restaurant>('/api/admin/restaurants', {
        name: f.name, slug: f.slug || undefined, currency: 'OMR', vatEnabled: true, vatRate: 5,
        plan: f.plan, defaultBranchName: f.branch || undefined,
        owner: f.oEmail && f.oPass
          ? { fullName: f.oName || f.name, email: f.oEmail, password: f.oPass }
          : undefined,
      });
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
          <div className="field"><label>{t('rPlan')}</label>
            <div className="seg">
              {(['STANDARD', 'PRO', 'ENTERPRISE'] as Plan[]).map((p) => (
                <button key={p} type="button" className={f.plan === p ? 'on' : ''}
                  onClick={() => setF((s) => ({ ...s, plan: p }))}>
                  {p === 'STANDARD' ? t('rPlanStd') : p === 'PRO' ? t('rPlanPro') : t('rPlanEnt')}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>{t('rBranch')}</label>
            <input value={f.branch} onChange={(e) => set('branch', e.target.value)} placeholder={f.name || '—'} /></div>
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
  const { data: catalogue } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get<PricingPlan[]>('/api/admin/plans'),
  });
  const [f, setF] = useState({ planName: 'Pro', billingCycle: 'MONTHLY' as BillingCycle, price: '25', status: 'ACTIVE' as SubscriptionStatus });
  // hydrate from existing once loaded
  useEffect(() => { if (existing) setF({ planName: existing.planName, billingCycle: existing.billingCycle, price: String(existing.price), status: existing.status }); }, [existing]);
  // Pick a tier → fills the name + monthly price (admin can still tweak below). Custom-price tiers leave the price as-is.
  const pickPlan = (p: PricingPlan) => setF((s) => ({ ...s, planName: p.name, price: p.monthlyPrice == null ? s.price : String(p.monthlyPrice), billingCycle: 'MONTHLY' }));
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
        {(catalogue ?? []).filter((p) => p.active).length > 0 && (
          <div className="plan-pick">
            <span className="plan-pick-lbl">{t('choosePlan')}</span>
            <div className="plan-pick-row">
              {(catalogue ?? []).filter((p) => p.active).map((p) => (
                <button key={p.id} type="button"
                  className={'plan-pick-card' + (f.planName === p.name ? ' on' : '')}
                  onClick={() => pickPlan(p)}>
                  <span className="pp-name">{p.name}</span>
                  <span className="pp-price">{p.monthlyPrice == null ? <b>{t('custom')}</b> : <><b>{omr(p.monthlyPrice)}</b> {t('cur')}{t('perMo')}</>}</span>
                  <span className="pp-setup">+{omr(p.setupFee)} {t('setupShort')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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

/** What each tier unlocks — keeps the gating visible right next to the price. */
const tierDesc = (tier: Plan, t: (k: string) => string) =>
  tier === 'STANDARD' ? t('tierStdDesc') : tier === 'ENTERPRISE' ? t('tierEntDesc') : t('tierProDesc');

/**
 * Pricing for the three fixed café tiers (STANDARD / PRO / ENTERPRISE). The tiers
 * are always present and drive feature-gating; here a platform admin edits each
 * tier's display name, monthly price (blank = "custom"), setup fee, and visibility.
 */
function PlansView({ t }: { t: (k: string) => string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get<PricingPlan[]>('/api/admin/plans'),
  });

  type Draft = { name: string; monthlyPrice: string; setupFee: string; active: boolean };
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', monthlyPrice: '', setupFee: '', active: true });

  const startEdit = (p: PricingPlan) => {
    setEditing(p.id);
    setDraft({ name: p.name, monthlyPrice: p.monthlyPrice == null ? '' : String(p.monthlyPrice), setupFee: String(p.setupFee), active: p.active });
  };

  const save = useMutation({
    mutationFn: (id: number) => {
      const priceBlank = draft.monthlyPrice.trim() === '';
      return api.patch(`/api/admin/plans/${id}`, {
        name: draft.name.trim(),
        monthlyPrice: priceBlank ? null : Number(draft.monthlyPrice),
        clearMonthlyPrice: priceBlank,
        setupFee: Number(draft.setupFee || 0),
        active: draft.active,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); toast(t('planSaved')); setEditing(null); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const canSave = draft.name.trim().length > 0 && !save.isPending;
  const price = (v: number | null) => v == null ? <span className="p-custom">{t('custom')}</span> : <><span className="num">{omr(v)}</span> <span className="rslug">{t('perMo')}</span></>;

  return (
    <div className="acontent">
      <div className="plans-head">
        <div className="ph">{t('plansSub')}</div>
      </div>
      <table className="tbl plans-tbl">
        <thead><tr>
          <th>{t('colTier')}</th><th>{t('colName')}</th><th>{t('colMonthly')}</th><th>{t('colSetup')}</th>
          <th className="hide-sm">{t('colUnlocks')}</th><th>{t('colStatus')}</th><th aria-label="actions" />
        </tr></thead>
        <tbody>
          {(plans ?? []).map((p) => editing === p.id ? (
            <tr className="edit-row" key={p.id}>
              <td><span className="tier-tag">{p.tier}</span></td>
              <td><input className="pin" placeholder={t('planNamePh')} value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus /></td>
              <td><input className="pin num" type="number" step="0.001" min="0" placeholder={t('custom')} value={draft.monthlyPrice}
                onChange={(e) => setDraft({ ...draft, monthlyPrice: e.target.value })} /></td>
              <td><input className="pin num" type="number" step="0.001" min="0" value={draft.setupFee}
                onChange={(e) => setDraft({ ...draft, setupFee: e.target.value })} /></td>
              <td className="hide-sm rslug">{tierDesc(p.tier, t)}</td>
              <td><button type="button" className={'chip btn-chip ' + (draft.active ? 'ok' : '')}
                onClick={() => setDraft({ ...draft, active: !draft.active })}><span className="d" />{draft.active ? t('planOn') : t('planOff')}</button></td>
              <td className="p-actions">
                <button className="btn sm" disabled={!canSave} onClick={() => save.mutate(p.id)}>{save.isPending ? '…' : t('save')}</button>
                <button className="btn sm ghost" onClick={() => setEditing(null)}>{t('cancel')}</button>
              </td>
            </tr>
          ) : (
            <tr key={p.id}>
              <td><span className="tier-tag">{p.tier}</span></td>
              <td><span className="p-name">{p.name}</span></td>
              <td>{price(p.monthlyPrice)}</td>
              <td><span className="num">{omr(p.setupFee)}</span></td>
              <td className="hide-sm rslug">{tierDesc(p.tier, t)}</td>
              <td><span className={'chip ' + (p.active ? 'ok' : '')}><span className="d" />{p.active ? t('planOn') : t('planOff')}</span></td>
              <td className="p-actions">
                <button className="icon-btn" title={t('edit')} onClick={() => startEdit(p)}>✎</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Platform-admin menu import: paste a whole menu as JSON and REPLACE this café's
 * current one. Deletes every existing item (then category — the API blocks deleting
 * a non-empty category), then recreates from the JSON via the normal menu endpoints,
 * passing restaurantId (allowed for PLATFORM_ADMIN). Photos are out of scope.
 */
function MenuImportModal({ restaurantId, restaurantName, onClose }:
  { restaurantId: number; restaurantName: string; onClose: () => void }) {
  const t = useT(DICT);
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'edit' | 'confirm' | 'running' | 'done'>('edit');
  const [parsed, setParsed] = useState<ImpCat[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ cats: number; items: number } | null>(null);

  const existingCatsQ = useQuery({ queryKey: ['admin-menu-cats', restaurantId], queryFn: () => api.get<CategoryResponse[]>(`/api/menu/categories?restaurantId=${restaurantId}`) });
  const existingItemsQ = useQuery({ queryKey: ['admin-menu-items', restaurantId], queryFn: () => api.get<MenuItemResponse[]>(`/api/menu/items?restaurantId=${restaurantId}`) });
  const existingCats = existingCatsQ.data ?? [];
  const existingItems = existingItemsQ.data ?? [];
  const loading = existingCatsQ.isLoading || existingItemsQ.isLoading;

  const itemCount = parsed.reduce((n, c) => n + (c.items?.length ?? 0), 0);

  const review = () => {
    const out = parseImport(text);
    if ('errors' in out) { setErrors(out.errors); setParsed([]); setPhase('edit'); return; }
    setErrors([]); setParsed(out.cats); setPhase('confirm');
  };

  const run = async () => {
    setPhase('running');
    const errs: string[] = [];
    let madeCats = 0, madeItems = 0;
    // 1) wipe — items first (a non-empty category can't be deleted), then categories
    for (let i = 0; i < existingItems.length; i++) {
      setProgress(`🗑 ${i + 1}/${existingItems.length}`);
      try { await api.del(`/api/menu/items/${existingItems[i].id}`); }
      catch (e) { errs.push(`delete item #${existingItems[i].id}: ${e instanceof ApiError ? e.message : 'failed'}`); }
    }
    for (const c of existingCats) {
      try { await api.del(`/api/menu/categories/${c.id}`); }
      catch (e) { errs.push(`delete category "${c.nameEn}": ${e instanceof ApiError ? e.message : 'failed'}`); }
    }
    // 2) recreate from JSON
    for (let ci = 0; ci < parsed.length; ci++) {
      const cat = parsed[ci];
      let catId: number;
      try {
        const created = await api.post<CategoryResponse>('/api/menu/categories', {
          restaurantId, nameEn: cat.nameEn, nameAr: cat.nameAr,
          descriptionEn: cat.descriptionEn ?? null, descriptionAr: cat.descriptionAr ?? null, displayOrder: ci,
        });
        catId = created.id; madeCats++;
      } catch (e) { errs.push(`category "${cat.nameEn}": ${e instanceof ApiError ? e.message : 'failed'}`); continue; }
      const items = cat.items ?? [];
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii];
        setProgress(`＋ ${cat.nameEn} › ${it.nameEn}`);
        try {
          await api.post('/api/menu/items', {
            restaurantId, categoryId: catId, nameEn: it.nameEn, nameAr: it.nameAr,
            descriptionEn: it.descriptionEn ?? null, descriptionAr: it.descriptionAr ?? null,
            price: it.price, preparationTimeMinutes: it.preparationTimeMinutes ?? null,
            available: it.available ?? true, displayOrder: ii, optionGroups: normalizeGroups(it.options),
          });
          madeItems++;
        } catch (e) { errs.push(`item "${cat.nameEn} › ${it.nameEn}": ${e instanceof ApiError ? e.message : 'failed'}`); }
      }
    }
    setErrors(errs);
    setResult({ cats: madeCats, items: madeItems });
    setProgress('');
    setPhase('done');
    qc.invalidateQueries({ queryKey: ['admin-menu-cats', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin-menu-items', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin-restaurant-stats'] });
  };

  const boxStyle: CSSProperties = {
    width: '100%', minHeight: 240, resize: 'vertical', direction: 'ltr',
    border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--text)',
    borderRadius: 10, padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5,
  };
  const errStyle: CSSProperties = { color: 'var(--bad)', fontSize: 12, fontWeight: 700, margin: '8px 0 0', whiteSpace: 'pre-wrap' };

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget && phase !== 'running') onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 620 }}>
        <h3>{t('importTitle')}</h3>
        <div className="ph">{restaurantName}</div>

        {phase === 'edit' && (<>
          <p className="ph">{t('importHint')}</p>
          <textarea style={boxStyle} spellCheck={false} placeholder={t('importPlace')} value={text}
            onChange={(e) => { setText(e.target.value); setErrors([]); }} />
          {errors.length > 0 && (
            <div style={errStyle}>{t('importBad')}{'\n'}{errors.slice(0, 8).join('\n')}{errors.length > 8 ? `\n…+${errors.length - 8}` : ''}</div>
          )}
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setText(IMPORT_SAMPLE)}>{t('importSample')}</button>
            <button className="btn" disabled={!text.trim()} onClick={review}>{t('importReview')}</button>
          </div>
        </>)}

        {phase === 'confirm' && (<>
          <div className="ph" style={{ color: 'var(--bad)' }}>{t('importWarn')}</div>
          {loading ? <div className="center" style={{ minHeight: 80 }}><div className="spinner" /></div> : (
            <div className="ph">
              <div><b>{t('willDelete')}:</b> {existingCats.length} {t('catsWord')} · {existingItems.length} {t('itemsWord')}</div>
              <div><b>{t('willAdd')}:</b> {parsed.length} {t('catsWord')} · {itemCount} {t('itemsWord')}</div>
            </div>
          )}
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setPhase('edit')}>{t('cancel')}</button>
            <button className="btn danger" disabled={loading} onClick={run}>{t('importConfirm')}</button>
          </div>
        </>)}

        {phase === 'running' && (
          <div className="center" style={{ minHeight: 160, flexDirection: 'column', gap: 12 }}>
            <div className="spinner" />
            <div className="num" style={{ color: 'var(--muted)', fontSize: 13 }}>{t('importing')} {progress}</div>
          </div>
        )}

        {phase === 'done' && (<>
          <div className="ph">
            <b style={{ color: 'var(--text)' }}>{t('importDoneT')}</b>
            <div style={{ marginTop: 6 }}>{result?.cats ?? 0} {t('catsWord')} · {result?.items ?? 0} {t('itemsWord')}</div>
          </div>
          {errors.length > 0 && (
            <div style={errStyle}>{t('importErrorsT')} ({errors.length}){'\n'}{errors.slice(0, 8).join('\n')}{errors.length > 8 ? `\n…+${errors.length - 8}` : ''}</div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>{t('closeBtn')}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
