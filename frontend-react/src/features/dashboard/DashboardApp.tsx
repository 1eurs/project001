import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create as createQrMatrix } from 'qrcode/lib/core/qrcode.js';
import { api, ApiError, logout, accessTokenValue, changeEmail, freshStreamToken, onAuthChange } from '../../lib/api';
import { useAuth, isManager, canAcceptOrders } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { useOrderStream, type StreamStatus } from '../../lib/sse';
import { useOrderSound, SoundToggle, notify } from '../../lib/alerts';
import { useWakeLock } from '../../lib/wakeLock';
import { omr, fmtElapsed } from '../../lib/format';
import { carColorOf } from '../../lib/carColors';
import type { OrderResponse, OrderStatus, BranchResponse, TableResponse, Restaurant, QrActivity } from '../../lib/types';
import { BRAND } from '../../lib/brand';
import Login from '../auth/Login';
import MenuManager, { MenuLookManager } from './MenuManager';
import OrdersPage from './OrdersPage';
import RestaurantProfile from './RestaurantProfile';
import InvoicePrint from './InvoicePrint';
import './dashboard.css';

const DICT: Dict = {
  ar: { title: 'شاشة المطبخ', live: 'مباشر', logoutT: 'خروج', cur: 'ر.ع', min: 'د', empty: 'لا طلبات',
        nav_board: 'الطلبات المباشرة', nav_tables: 'الطاولات ورموز QR', nav_orders: 'سجل الطلبات', nav_menu: 'إدارة القائمة', nav_look: 'شكل قائمة العملاء', nav_profile: 'ملف المطعم',
        col_PENDING: 'جديد', col_ACCEPTED: 'مقبول', col_PREPARING: 'قيد التحضير', col_READY: 'جاهز',
        table: 'طاولة', takeaway: 'سفري', car: 'خدمة السيارة', note: 'ملاحظة',
        accept: 'قبول', decline: 'رفض', startPrep: 'بدء التحضير', ready: 'جاهز', complete: 'اكتمل', cancel: 'إلغاء',
        unpaid: 'تحديد كمدفوع', paid: 'مدفوع', confirm: 'تأكيد', back: 'رجوع',
        acceptT: 'قبول الطلب', acceptP: 'كم دقيقة للتحضير؟', declineT: 'رفض الطلب', declineP: 'سبب الرفض (يظهر للعميل)',
        cancelT: 'إلغاء الطلب', cancelP: 'سبب الإلغاء (اختياري)', reason: 'السبب',
        tablesTitle: 'الطاولات ورموز QR', addTable: '＋ طاولة', tableNumber: 'رقم الطاولة', add: 'إضافة',
        print: 'طباعة الكل', printOne: 'طباعة الرمز', printInv: 'طباعة الفاتورة', regenerate: 'تجديد الرمز', del: 'حذف', scan: 'امسح للطلب', copy: 'نسخ الرابط', copied: 'تم النسخ', carQr: 'رمز سيارات الخارج',
        noTables: 'لا توجد طاولات بعد', regenWarn: 'سيتوقف الرمز القديم عن العمل. متابعة؟', delWarn: 'حذف هذه الطاولة؟',
        syncing: 'مزامنة الطلبات', autoRefresh: 'التحديث التلقائي يعمل', newOrder: 'طلب جديد', newOrders: 'طلبات جديدة', tapView: 'اضغط للعرض',
        loginTitle: 'لوحة Serva.', loginSub: 'سجّل الدخول لإدارة الطلبات المباشرة', saved: 'تم الحفظ',
        orderingNow: 'يطلبون الآن', qaNow: 'الآن', qaToday: 'اليوم', qaOrders: 'طلب',
        account: 'الحساب', email: 'البريد', language: 'اللغة', arabic: 'العربية', english: 'English', changePassword: 'تغيير كلمة المرور', changeEmail: 'تغيير البريد الإلكتروني',
        changePwSub: 'أدخل كلمة المرور الحالية ثم الجديدة.', currentPw: 'كلمة المرور الحالية',
        changeEmailSub: 'أدخل كلمة المرور الحالية والبريد الجديد.', newEmail: 'البريد الجديد',
        newPw: 'كلمة المرور الجديدة', confirmPw: 'تأكيد كلمة المرور', save: 'حفظ',
        pwChanged: 'تم تغيير كلمة المرور', pwTooShort: 'كلمة المرور 8 أحرف على الأقل', pwMismatch: 'كلمتا المرور غير متطابقتين',
        emailChanged: 'تم تغيير البريد الإلكتروني', emailInvalid: 'أدخل بريدًا صحيحًا',
        role_PLATFORM_ADMIN: 'مشرف المنصة', role_RESTAURANT_OWNER: 'مالك المطعم', role_BRANCH_MANAGER: 'مدير الفرع',
        role_STAFF: 'موظف', role_KITCHEN_STAFF: 'مطبخ' },
  en: { title: 'Kitchen Display', live: 'Live', logoutT: 'Logout', cur: 'OMR', min: 'min', empty: 'No orders',
        nav_board: 'Live orders', nav_tables: 'Tables & QR', nav_orders: 'Order history', nav_menu: 'Menu', nav_look: 'Customer menu look', nav_profile: 'Restaurant profile',
        col_PENDING: 'New', col_ACCEPTED: 'Accepted', col_PREPARING: 'Preparing', col_READY: 'Ready',
        table: 'Table', takeaway: 'Takeaway', car: 'Outdoor car', note: 'Note',
        accept: 'Accept', decline: 'Decline', startPrep: 'Start preparing', ready: 'Ready', complete: 'Complete', cancel: 'Cancel',
        unpaid: 'Mark paid', paid: 'Paid', confirm: 'Confirm', back: 'Back',
        acceptT: 'Accept order', acceptP: 'How many minutes to prepare?', declineT: 'Decline order', declineP: 'Reason (shown to customer)',
        cancelT: 'Cancel order', cancelP: 'Cancel reason (optional)', reason: 'Reason',
        tablesTitle: 'Tables & QR codes', addTable: '＋ Table', tableNumber: 'Table number', add: 'Add',
        print: 'Print all', printOne: 'Print QR', printInv: 'Print invoice', regenerate: 'Regenerate', del: 'Delete', scan: 'Scan to order', copy: 'Copy link', copied: 'Copied', carQr: 'Outdoor car QR',
        noTables: 'No tables yet', regenWarn: 'The old QR will stop working. Continue?', delWarn: 'Delete this table?',
        syncing: 'Syncing orders', autoRefresh: 'Auto-refresh on', newOrder: 'New order', newOrders: 'new orders', tapView: 'Tap to view',
        loginTitle: 'Serva. dashboard', loginSub: 'Sign in to manage live orders', saved: 'Saved',
        orderingNow: 'ordering now', qaNow: 'now', qaToday: 'Today', qaOrders: 'orders',
        account: 'Account', email: 'Email', language: 'Language', arabic: 'Arabic', english: 'English', changePassword: 'Change password', changeEmail: 'Change email',
        changePwSub: 'Enter your current password, then a new one.', currentPw: 'Current password',
        changeEmailSub: 'Enter your current password and new email.', newEmail: 'New email',
        newPw: 'New password', confirmPw: 'Confirm new password', save: 'Save',
        pwChanged: 'Password changed', pwTooShort: 'Use at least 8 characters', pwMismatch: 'Passwords don’t match',
        emailChanged: 'Email changed', emailInvalid: 'Enter a valid email',
        role_PLATFORM_ADMIN: 'Platform admin', role_RESTAURANT_OWNER: 'Owner', role_BRANCH_MANAGER: 'Branch manager',
        role_STAFF: 'Staff', role_KITCHEN_STAFF: 'Kitchen' },
};

const COLS: { st: OrderStatus; color: string }[] = [
  { st: 'PENDING', color: 'var(--pending)' },
  { st: 'ACCEPTED', color: 'var(--accepted)' },
  { st: 'PREPARING', color: 'var(--preparing)' },
  { st: 'READY', color: 'var(--ready)' },
];
// statuses that belong on the live board; anything else has left it (completed/declined/cancelled)
const LIVE_SET = new Set<OrderStatus>(['PENDING', 'ACCEPTED', 'PREPARING', 'READY']);

export default function DashboardApp() {
  const { user, authed } = useAuth();
  const t = useT(DICT);
  if (!authed || !user) {
    return <Login mark={BRAND.name} title={t('loginTitle')} subtitle={t('loginSub')} />;
  }
  return <Shell />;
}

type Page = 'board' | 'orders' | 'menu' | 'look' | 'profile' | 'tables';

function LivePill({ stream, t }: { stream: StreamStatus; t: (k: string) => string }) {
  if (stream === 'open') {
    return <span className="dlive"><span className="d" />{t('live')}</span>;
  }
  if (stream === 'connecting') {
    return <span className="dlive sync"><span className="d" />{t('syncing')}</span>;
  }
  return <span className="dlive fallback"><span className="d" />{t('autoRefresh')}</span>;
}

/* Reconnects normally complete in under a second — only show a degraded pill state
   when it actually persists, so routine stream recycles never flicker the UI. */
function useCalmStream(stream: StreamStatus, delayMs = 5_000): StreamStatus {
  const [shown, setShown] = useState(stream);
  useEffect(() => {
    if (stream === 'open') { setShown('open'); return; }
    const id = window.setTimeout(() => setShown(stream), delayMs);
    return () => window.clearTimeout(id);
  }, [stream, delayMs]);
  return shown;
}

function Shell() {
  const { user } = useAuth();
  const t = useT(DICT);
  const role = user!.role;
  const [page, setPage] = useState<Page>('board');
  const sound = useOrderSound();
  const [stream, setStream] = useState<StreamStatus>('connecting');
  const calmStream = useCalmStream(stream);
  const titles: Record<string, string> = { board: t('title'), orders: t('nav_orders'), menu: t('nav_menu'), look: t('nav_look'), profile: t('nav_profile'), tables: t('tablesTitle') };

  const navItems = ([
    { key: 'board', icon: '🍳', label: t('nav_board'), show: true },
    { key: 'orders', icon: '🧾', label: t('nav_orders'), show: true },
    { key: 'menu', icon: '📋', label: t('nav_menu'), show: isManager(role) },
    { key: 'look', icon: '🎨', label: t('nav_look'), show: isManager(role) },
    { key: 'tables', icon: '🔳', label: t('nav_tables'), show: isManager(role) },
  ] as { key: Page; icon: string; label: string; show: boolean }[]).filter((i) => i.show);

  const qc = useQueryClient();
  const branchesQ = useQuery({
    queryKey: ['branches', user!.restaurantId],
    queryFn: () => api.get<any>(`/api/restaurants/${user!.restaurantId}/branches`),
    enabled: isManager(role) && !!user!.restaurantId,
  });
  const branchesRaw = branchesQ.data;
  const branches: BranchResponse[] = Array.isArray(branchesRaw) ? branchesRaw : branchesRaw?.content ?? [];

  const [branchId, setBranchId] = useState<number | undefined>(user!.branchId ?? undefined);
  useEffect(() => { if (branchId == null && branches.length) setBranchId(branches[0].id); }, [branches]); // eslint-disable-line

  // Self-heal: a café onboarded before branches were auto-created has none — and without one
  // the Tables & QR page is dead. When an owner lands here with zero branches, provision a
  // default branch (named after the café) so QR codes work immediately.
  const canMakeBranch = role === 'RESTAURANT_OWNER' || role === 'PLATFORM_ADMIN';
  const needsBranch = canMakeBranch && branchesQ.isSuccess && branches.length === 0;
  const restaurantQ = useQuery({
    queryKey: ['restaurant', user!.restaurantId],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${user!.restaurantId}`),
    enabled: needsBranch && !!user!.restaurantId,
  });
  const madeBranchRef = useRef(false);
  const makeBranch = useMutation({
    mutationFn: (name: string) => api.post<BranchResponse>(`/api/restaurants/${user!.restaurantId}/branches`, { name }),
    onSuccess: (b) => {
      qc.setQueryData(['branches', user!.restaurantId], (p: any) => (Array.isArray(p) ? [...p, b] : [b]));
      setBranchId(b.id);
    },
  });
  useEffect(() => {
    if (madeBranchRef.current || !needsBranch || !restaurantQ.data) return;
    madeBranchRef.current = true;
    makeBranch.mutate(restaurantQ.data.name);
  }, [needsBranch, restaurantQ.data]); // eslint-disable-line

  return (
    <div className="dash">
      <aside className="rail">
        <div className="logo">S.</div>
        <nav className="nav">
          {navItems.map((it) => (
            <button key={it.key} className={page === it.key ? 'on' : ''} onClick={() => setPage(it.key)} aria-label={it.label}>
              {it.icon}<span className="tip">{it.label}</span>
            </button>
          ))}
        </nav>
        <button className="out" title={t('logoutT')} onClick={() => logout()}>⏻</button>
      </aside>

      <div className="dmain">
        <div className="dtop">
          <h2>{titles[page]}</h2>
          {page === 'board' && <LivePill stream={calmStream} t={t} />}
          <div className="spacer" />
          {isManager(role) && branches.length > 0 && (
            <select className="select" value={branchId ?? ''} onChange={(e) => setBranchId(Number(e.target.value))}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <SoundToggle soundOn={sound.soundOn} onToggle={sound.toggle} />
          <AccountMenu
            t={t}
            showProfile={isManager(role)}
            profileActive={page === 'profile'}
            onProfile={() => setPage('profile')}
          />
        </div>

        {page === 'board' && <KdsBoard branchId={branchId} ping={sound.ping} onStatus={setStream} />}
        {page === 'orders' && <OrdersPage branchId={branchId} />}
        {page === 'menu' && <MenuManager />}
        {page === 'look' && <MenuLookManager branchId={branchId} />}
        {page === 'profile' && <RestaurantProfile branchId={branchId} />}
        {page === 'tables' && <TablesPage branchId={branchId} />}
      </div>

      <nav className="dnav-bottom">
        {navItems.map((it) => (
          <button key={it.key} className={page === it.key ? 'on' : ''} onClick={() => setPage(it.key)}>
            <span className="ic">{it.icon}</span><span className="lb">{it.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================ ACCOUNT MENU ============================ */
function AccountMenu({
  t,
  showProfile,
  profileActive,
  onProfile,
}: {
  t: (k: string) => string;
  showProfile: boolean;
  profileActive: boolean;
  onProfile: () => void;
}) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = user!.fullName.split(' ').map((s) => s[0]).slice(0, 2).join('');
  const roleLabel = t('role_' + user!.role);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="who" ref={ref}>
      <button className="who-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <div className="av">{initials}</div>
        <div className="who-txt"><div className="nm">{user!.fullName}</div><div className="rl">{roleLabel}</div></div>
        <span className="who-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-head">
            <div className="av lg">{initials}</div>
            <div className="acct-id">
              <div className="acct-name">{user!.fullName}</div>
              <div className="acct-mail" title={user!.email}>{user!.email}</div>
              <span className="acct-role">{roleLabel}</span>
            </div>
          </div>
          <div className="acct-sep" />
          {showProfile && (
            <button className={'acct-item' + (profileActive ? ' on' : '')} role="menuitem" onClick={() => { onProfile(); setOpen(false); }}>
              <span className="ai-ic">🏪</span>{t('nav_profile')}
            </button>
          )}
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
      {pwOpen && <ChangePasswordModal t={t} onClose={() => setPwOpen(false)} />}
      {emailOpen && <ChangeEmailModal t={t} onClose={() => setEmailOpen(false)} />}
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
  const [next, setNext] = useState(user!.email);
  const email = next.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const change = useMutation({
    mutationFn: () => changeEmail(cur, email),
    onSuccess: () => { toast(t('emailChanged')); onClose(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const invalid = email.length > 0 && !validEmail;
  const unchanged = email.toLowerCase() === user!.email.toLowerCase();
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

/* ============================ KDS BOARD ============================ */
type Modal = { type: 'accept' | 'decline' | 'cancel'; order: OrderResponse } | null;

function KdsBoard({ branchId, ping, onStatus }: { branchId?: number; ping: () => void; onStatus: (s: StreamStatus) => void }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const role = user!.role;

  // keep the screen awake while the live board is open (counter phone / tablet)
  useWakeLock(true);

  const { data: tablesRaw } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get<any>(`/api/branches/${branchId}/tables`),
    enabled: !!branchId,
  });
  const tableNo = useMemo(() => {
    const list: TableResponse[] = Array.isArray(tablesRaw) ? tablesRaw : tablesRaw?.content ?? [];
    return new Map(list.map((tb) => [tb.id, tb.tableNumber]));
  }, [tablesRaw]);

  const liveKey = ['live', branchId ?? 'all'];
  const { data: orders = [] } = useQuery({
    queryKey: liveKey,
    queryFn: () => api.get<OrderResponse[]>(`/api/dashboard/orders/live${branchId ? `?branchId=${branchId}` : ''}`),
    refetchInterval: 15_000,
  });

  const [unacked, setUnacked] = useState(0);
  const [mobileCol, setMobileCol] = useState<OrderStatus>('PENDING');
  const lastStreamFallbackRefresh = useRef(0);
  const prevStreamStatus = useRef<StreamStatus | null>(null);

  // EventSource bakes the JWT into its URL and can't change it on auto-reconnect, so when
  // the token rotates (or expires mid-stream) we rebuild the URL ourselves and the effect
  // reconnects with fresh credentials.
  const [streamToken, setStreamToken] = useState(accessTokenValue);
  useEffect(() => onAuthChange(() => setStreamToken(accessTokenValue())), []);

  const streamUrl = branchId && streamToken ? `/api/dashboard/orders/stream?branchId=${branchId}&access_token=${encodeURIComponent(streamToken)}` : null;
  const handleStreamStatus = (status: StreamStatus) => {
    onStatus(status);
    const prev = prevStreamStatus.current;
    prevStreamStatus.current = status;
    if (status === 'open') {
      // Back after a real drop → resync once; events from the gap never replay on their own.
      if (prev === 'reconnecting') qc.invalidateQueries({ queryKey: liveKey });
      return;
    }
    const now = Date.now();
    if (now - lastStreamFallbackRefresh.current > 5_000) {
      lastStreamFallbackRefresh.current = now;
      qc.invalidateQueries({ queryKey: liveKey });
      // An expired JWT is the other common drop cause — swap in a fresh one if needed.
      freshStreamToken().then((tk) => { if (tk) setStreamToken((p) => (tk !== p ? tk : p)); });
    }
  };
  useOrderStream(
    streamUrl,
    (name, data) => {
      // Apply the event payload straight to the cache → the board updates instantly,
      // with no refetch round-trip and no read-after-write race against the order's
      // own DB commit. (The 15s poll + reconnect refetch stay as a safety net.)
      const o = data as OrderResponse | null;
      if (o && typeof o.id === 'number') {
        qc.setQueryData<OrderResponse[]>(liveKey, (prev = []) => {
          const rest = prev.filter((x) => x.id !== o.id);
          if (!LIVE_SET.has(o.status)) return rest; // moved to a terminal status → drop
          return [...rest, o].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        });
      } else {
        qc.invalidateQueries({ queryKey: liveKey });
      }
      if (name === 'order.created') {
        ping();
        setUnacked((n) => n + 1);
        notify(t('newOrder'), o?.orderNumber ? `#${o.orderNumber}` : '');
      }
    },
    handleStreamStatus,
  );

  // flash the tab title with the unread count when the dashboard is in the background
  useEffect(() => {
    document.title = unacked > 0 ? `(${unacked}) ${t('newOrder')} — Serva.` : 'Serva.';
    return () => { document.title = 'Serva.'; };
  }, [unacked, t]);
  useEffect(() => {
    const onVis = () => { if (!document.hidden) setUnacked(0); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Keep ringing every ~12s while new orders sit unacknowledged (staff stepped away),
  // stopping the moment the banner is tapped / tab refocused — capped so it never nags forever.
  useEffect(() => {
    if (unacked <= 0) return;
    let rings = 0;
    const id = setInterval(() => {
      if (++rings > 5) { clearInterval(id); return; }
      ping();
    }, 12_000);
    return () => clearInterval(id);
  }, [unacked > 0, ping]); // eslint-disable-line react-hooks/exhaustive-deps

  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(i); }, []);

  const [modal, setModal] = useState<Modal>(null);
  const [field, setField] = useState('');
  const [invoice, setInvoice] = useState<OrderResponse | null>(null);

  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api.patch<OrderResponse>(path, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKey }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  const pay = useMutation({
    mutationFn: (id: number) => api.post(`/api/payments/orders/${id}/mark-paid`, { method: 'CARD' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKey }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const openModal = (type: NonNullable<Modal>['type'], order: OrderResponse) => { setField(type === 'accept' ? '6' : ''); setModal({ type, order }); };
  const confirmModal = () => {
    if (!modal) return;
    const id = modal.order.id;
    if (modal.type === 'accept') act.mutate({ path: `/api/dashboard/orders/${id}/accept`, body: { prepTimeMinutes: Number(field) || null } });
    if (modal.type === 'decline') act.mutate({ path: `/api/dashboard/orders/${id}/decline`, body: { reason: field } });
    if (modal.type === 'cancel') act.mutate({ path: `/api/dashboard/orders/${id}/cancel`, body: { reason: field || null } });
    setModal(null);
  };

  const canAccept = canAcceptOrders(role);

  return (
    <>
      {unacked > 0 && (
        <button className="newbanner" onClick={() => { setUnacked(0); setMobileCol('PENDING'); }}>
          <span className="nb-dot" />
          <b>{unacked}</b> {t('newOrders')} · {t('tapView')}
        </button>
      )}

      <div className="board-tabs">
        {COLS.map((c) => {
          const n = orders.filter((o) => o.status === c.st).length;
          return (
            <button key={c.st} className={mobileCol === c.st ? 'on' : ''} style={{ ['--col' as any]: c.color }} onClick={() => setMobileCol(c.st)}>
              <span className="bt-dot" style={{ background: c.color }} />{t('col_' + c.st)}<span className="bt-cnt">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="board">
        {COLS.map((c) => {
          const list = orders.filter((o) => o.status === c.st);
          return (
            <div className={'col' + (mobileCol === c.st ? ' active' : '')} key={c.st} style={{ ['--col' as any]: c.color }}>
              <div className="col-head"><span className="dot" style={{ background: c.color }} /><h3>{t('col_' + c.st)}</h3><span className="cnt" style={{ background: c.color }}>{list.length}</span></div>
              <div className="col-body">
                {list.length === 0 ? <div className="col-empty">{t('empty')}</div> : list.map((o) => (
                  <OrderCard key={o.id} o={o} tableNo={tableNo} t={t} lang={lang} canAccept={canAccept}
                    onAccept={() => openModal('accept', o)} onDecline={() => openModal('decline', o)} onCancel={() => openModal('cancel', o)}
                    onPreparing={() => act.mutate({ path: `/api/dashboard/orders/${o.id}/preparing` })}
                    onReady={() => act.mutate({ path: `/api/dashboard/orders/${o.id}/ready` })}
                    onComplete={() => act.mutate({ path: `/api/dashboard/orders/${o.id}/complete` })}
                    onPay={() => pay.mutate(o.id)} onPrint={() => setInvoice(o)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {invoice && <InvoicePrint order={invoice} onDone={() => setInvoice(null)} />}

      {modal && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-card">
            <h3>{t(modal.type + 'T')}</h3>
            <div className="ph">{t(modal.type + 'P')} · {modal.order.orderNumber}</div>
            {modal.type === 'accept'
              ? <><input className="input num" type="number" min={1} value={field} onChange={(e) => setField(e.target.value)} />
                  <div className="preset">{[3, 5, 8, 10, 15].map((n) => <button key={n} onClick={() => setField(String(n))}>{n} {t('min')}</button>)}</div></>
              : <textarea className="input" rows={2} value={field} placeholder={t('reason') + '…'} onChange={(e) => setField(e.target.value)} />}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModal(null)}>{t('back')}</button>
              <button className={'btn' + (modal.type === 'accept' ? '' : ' danger')} onClick={confirmModal}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CarColorTag({ color, lang }: { color?: string | null; lang: string }) {
  const cc = carColorOf(color);
  if (!cc) return null;
  return <span className="carcol"><span className="cc-dot" style={{ background: cc.hex }} />{lang === 'ar' ? cc.ar : cc.en}</span>;
}

function OrderCard({ o, tableNo, t, lang, canAccept, onAccept, onDecline, onCancel, onPreparing, onReady, onComplete, onPay, onPrint }: any) {
  const el = fmtElapsed(o.createdAt);
  const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
  const where = o.orderType === 'DINE_IN'
    ? <span className="where">🪑 <span className="tg">{t('table')} {o.tableId ? (tableNo.get(o.tableId) ?? o.tableId) : ''}</span></span>
    : o.orderType === 'CAR'
      ? <span className="where">🚗 <span className="tg">{t('car')}{o.carPlate ? ` · ${o.carPlate}` : ''}</span><CarColorTag color={o.carColor} lang={lang} /></span>
    : <span className="where">🥡 <span className="tg">{t('takeaway')}</span></span>;
  return (
    <div className="ocard">
      <div className="ocard-top"><span className="ordno">{o.orderNumber}</span><span className={'elapsed' + (mins > 10 ? ' late' : mins > 5 ? ' warn' : '')}>{el}</span>
        <button className="oprint" title={t('printInv')} aria-label={t('printInv')} onClick={onPrint}>🖨</button></div>
      {where}
      {o.status === 'ACCEPTED' && o.prepTimeMinutes ? <span className="where" style={{ color: 'var(--accepted)' }}>⏱ ~ <span className="num">{o.prepTimeMinutes}</span> {t('min')}</span> : null}
      <div className="olines">
        {o.items.map((i: any) => (
          <div className="ln" key={i.id}><span className="q num">{i.quantity}×</span>
            <span>{lang === 'ar' ? (i.nameAr || i.nameEn) : (i.nameEn || i.nameAr)}{i.note ? <span className="nt">↳ {i.note}</span> : null}</span></div>
        ))}
      </div>
      {o.customerNote && <div className="onote"><b>{t('note')}:</b> {o.customerNote}{o.customerName ? ` — ${o.customerName}` : ''}</div>}
      <div className="ocard-foot">
        <span className="ototal num">{omr(o.total)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t('cur')}</span></span>
        {o.paymentStatus === 'PAID' ? <span className="pay paid">✓ {t('paid')}</span> : <span className="pay unpaid" onClick={onPay}>{t('unpaid')}</span>}
      </div>
      <div className="oactions">
        {o.status === 'PENDING' && canAccept && <><button className="btn sm" onClick={onAccept}>{t('accept')}</button><button className="btn sm ghost" onClick={onDecline}>{t('decline')}</button></>}
        {o.status === 'ACCEPTED' && <><button className="btn sm" onClick={onPreparing}>{t('startPrep')}</button><button className="btn sm danger" onClick={onCancel}>{t('cancel')}</button></>}
        {o.status === 'PREPARING' && <><button className="btn sm" onClick={onReady}>{t('ready')}</button><button className="btn sm danger" onClick={onCancel}>{t('cancel')}</button></>}
        {o.status === 'READY' && <button className="btn sm" onClick={onComplete}>{t('complete')}</button>}
      </div>
    </div>
  );
}

/* ============================ TABLES & QR ============================ */
const customerUrlOf = (tb: TableResponse) => {
  try { return window.location.origin + new URL(tb.qrCodeUrl!).pathname; }
  catch { return `${window.location.origin}/t/${tb.qrCodeToken}`; }
};
const carUrlOf = (slug: string, branchId: number) => `${window.location.origin}/r/${slug}/b/${branchId}/car`;
const slugOf = (tb: TableResponse) => { try { return new URL(tb.qrCodeUrl!).pathname.split('/')[2] ?? ''; } catch { return ''; } };
/* Bold-style QR: we render the matrix ourselves as inline SVG so the pattern
   matches the landing poster — ink "dot" modules, rounded finder eyes — and the
   center "Serva." badge is real inline <text> in Bricolage (an embedded <image>
   logo renders in a font sandbox and silently falls back to Arial). Error
   correction stays at H so the rounded modules + cleared badge area still scan. */
const fmt = (v: number) => Math.round(v * 100) / 100;
const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rad = Math.min(r, w / 2, h / 2);
  return `M${fmt(x + rad)} ${fmt(y)}h${fmt(w - 2 * rad)}a${fmt(rad)} ${fmt(rad)} 0 0 1 ${fmt(rad)} ${fmt(rad)}`
    + `v${fmt(h - 2 * rad)}a${fmt(rad)} ${fmt(rad)} 0 0 1 ${fmt(-rad)} ${fmt(rad)}`
    + `h${fmt(-(w - 2 * rad))}a${fmt(rad)} ${fmt(rad)} 0 0 1 ${fmt(-rad)} ${fmt(-rad)}`
    + `v${fmt(-(h - 2 * rad))}a${fmt(rad)} ${fmt(rad)} 0 0 1 ${fmt(rad)} ${fmt(-rad)}z`;
};

function BrandedQrCode({ value, size, fgColor = '#0a1712', marginSize = 1, badge = true }:
  { value: string; size: number; fgColor?: string; marginSize?: number; badge?: boolean }) {
  const { cells, eyes, cell } = useMemo(() => {
    const { modules } = createQrMatrix(value, { errorCorrectionLevel: 'H' });
    const n = modules.size;
    const dim = n + marginSize * 2;
    const cell = size / dim;
    const off = marginSize * cell;
    const px = (i: number) => off + i * cell;
    const isFinder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    // center badge knockout (px) — skip modules underneath so the mark sits clean
    const bw = badge ? size * 0.3 : 0, bh = badge ? size * 0.135 : 0;
    const bx = (size - bw) / 2, by = (size - bh) / 2, bpad = cell * 0.7;
    const inBadge = (cx: number, cy: number) =>
      badge && cx > bx - bpad && cx < bx + bw + bpad && cy > by - bpad && cy < by + bh + bpad;

    // Soft "rounded square" modules at full cell size: corners are rounded but
    // straight edges keep neighbours touching, so finder/timing runs stay solid
    // and the code decodes like a normal QR (separated dots break detection).
    let cells = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!modules.get(r, c) || isFinder(r, c)) continue;
        const cx = px(c) + cell / 2, cy = px(r) + cell / 2;
        if (inBadge(cx, cy)) continue;
        cells += roundRectPath(px(c), px(r), cell, cell, cell * 0.35);
      }
    }
    const eye = (gr: number, gc: number) => {
      const x = px(gc), y = px(gr), s = cell * 7;
      return `${roundRectPath(x, y, s, s, cell * 1.75)}${roundRectPath(x + cell, y + cell, cell * 5, cell * 5, cell * 1.2)}${roundRectPath(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.9)}`;
    };
    const eyes = `${eye(0, 0)}${eye(0, n - 7)}${eye(n - 7, 0)}`;
    return { cells, eyes, cell };
  }, [value, size, marginSize, badge]);

  const bw = size * 0.3, bh = size * 0.135, bx = (size - bw) / 2, by = (size - bh) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" shapeRendering="geometricPrecision">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={cells} fill={fgColor} />
      {/* finder eyes: ink frame, white gap, ink pupil (even-odd lets one path nest) */}
      <path d={eyes} fill={fgColor} fillRule="evenodd" />
      {badge && (
        <>
          <path d={roundRectPath(bx - cell, by - cell, bw + cell * 2, bh + cell * 2, cell * 1.4)} fill="#ffffff" />
          <path d={roundRectPath(bx, by, bw, bh, bh * 0.3)} fill="#34e2a4" stroke={fgColor} strokeWidth={Math.max(2, size * 0.013)} />
          <text x={size / 2} y={size / 2 + bh * 0.02} textAnchor="middle" dominantBaseline="central" direction="ltr" unicodeBidi="bidi-override"
            fontFamily="'Bricolage Grotesque','IBM Plex Sans Arabic',system-ui,sans-serif"
            fontWeight={800} fontSize={bh * 0.6} letterSpacing="-0.02em" fill={fgColor}>{'Serva.\u200E'}</text>
        </>
      )}
    </svg>
  );
}
type PrintQrJob = { title: string; subtitle?: string; value: string };

function TablesPage({ branchId }: { branchId?: number }) {
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [num, setNum] = useState('');
  const [singlePrint, setSinglePrint] = useState<PrintQrJob | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get<any>(`/api/branches/${branchId}/tables`),
    enabled: !!branchId,
  });
  const tables: TableResponse[] = Array.isArray(raw) ? raw : raw?.content ?? [];
  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.restaurantId],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${user!.restaurantId}`),
    enabled: !!user?.restaurantId,
  });
  const restaurantSlug = restaurant?.slug;
  const carUrl = branchId && restaurantSlug ? carUrlOf(restaurantSlug, branchId) : null;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tables', branchId] });

  // Live "ordering now" + today's orders per QR. Initial fetch + 30s safety poll; the SSE below
  // pushes instant updates into this same cache.
  const { data: activity } = useQuery({
    queryKey: ['qr-activity', branchId],
    queryFn: () => api.get<QrActivity>(`/api/dashboard/qr-activity?branchId=${branchId}`),
    enabled: !!branchId,
    refetchInterval: 30_000,
  });
  // Realtime: push fresh snapshots straight into the query cache (no polling delay).
  // Rebuilds the stream when the JWT rotates — EventSource can't update its URL itself.
  const [qaToken, setQaToken] = useState(accessTokenValue);
  useEffect(() => onAuthChange(() => setQaToken(accessTokenValue())), []);
  useEffect(() => {
    if (!branchId) return;
    const url = `/api/dashboard/qr-activity/stream?branchId=${branchId}${qaToken ? `&access_token=${encodeURIComponent(qaToken)}` : ''}`;
    const es = new EventSource(url);
    const onMsg = (e: MessageEvent) => {
      try { qc.setQueryData(['qr-activity', branchId], JSON.parse(e.data) as QrActivity); } catch { /* ignore */ }
    };
    es.addEventListener('qr-activity', onMsg as EventListener);
    return () => { es.removeEventListener('qr-activity', onMsg as EventListener); es.close(); };
  }, [branchId, qc, qaToken]);
  const todayOf = (key?: string) => (key ? activity?.todayByKey[key] : undefined);
  const ActivityRow = ({ liveKey, todayKey }: { liveKey: string; todayKey: string }) => {
    const live = activity?.liveByKey[liveKey];
    const day = todayOf(todayKey);
    return (
      <div className="qa-row">
        {live && live.present > 0 && (
          <span className="qa-live" title={t('qaNow')}>
            👀 {live.present}{live.ordering > 0 && <> · 🛒 {live.ordering}</>}
          </span>
        )}
        <span className="qa-today">{t('qaToday')}: {day?.orders ?? 0} {t('qaOrders')} · <span className="num">{omr(day?.revenue ?? 0)}</span> {t('cur')}</span>
      </div>
    );
  };

  const create = useMutation({
    mutationFn: () => api.post(`/api/branches/${branchId}/tables`, { tableNumber: num.trim() }),
    onSuccess: () => { setNum(''); invalidate(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  const regen = useMutation({
    mutationFn: (id: number) => api.post(`/api/tables/${id}/regenerate-qr`),
    onSuccess: invalidate, onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.del(`/api/tables/${id}`),
    onSuccess: invalidate, onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  useEffect(() => {
    const clearSinglePrint = () => setSinglePrint(null);
    window.addEventListener('afterprint', clearSinglePrint);
    return () => window.removeEventListener('afterprint', clearSinglePrint);
  }, []);
  const printAll = () => {
    setSinglePrint(null);
    window.setTimeout(() => window.print(), 0);
  };
  const printOne = (job: PrintQrJob) => {
    setSinglePrint(job);
    window.setTimeout(() => window.print(), 0);
  };

  if (!branchId) return <div className="placeholder"><div><div className="ic">🏬</div><p>—</p></div></div>;

  return (
    <div className="tables-wrap no-print">
      <div className="tables-tool">
        <form className="addtable" onSubmit={(e) => { e.preventDefault(); if (num.trim()) create.mutate(); }}>
          <input className="input" style={{ maxWidth: 160 }} value={num} onChange={(e) => setNum(e.target.value)} placeholder={t('tableNumber')} />
          <button className="btn sm" disabled={!num.trim() || create.isPending}>{t('add')}</button>
        </form>
        {!!activity?.totalPresent && (
          <span className="qa-total"><span className="qa-d" />👀 {activity.totalPresent}{activity.totalOrdering > 0 && <> · 🛒 {activity.totalOrdering}</>} {t('orderingNow')}</span>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn sm ghost" disabled={!tables.length && !carUrl} onClick={printAll}>🖨 {t('print')}</button>
      </div>

      {isLoading ? <div className="center"><div className="spinner" /></div>
        : tables.length === 0 && !carUrl ? <div className="empty"><div className="big">🪑</div><h3>{t('noTables')}</h3></div>
        : (
          <div className="tcards">
            {carUrl && (
              <div className="tcard" key="outdoor-car">
                <div className="tcard-hd"><span className="tnum">🚗 {t('carQr')}</span></div>
                <div className="qrtile"><BrandedQrCode value={carUrl} size={150} /></div>
                <button className="tlink" title={carUrl} onClick={() => { navigator.clipboard?.writeText(carUrl); toast(t('copied')); }}>{t('copy')} ⧉</button>
                <ActivityRow liveKey="car" todayKey="car" />
                <div className="tcard-actions">
                  <button className="btn sm ghost" onClick={() => printOne({ title: t('carQr'), subtitle: restaurantSlug ?? '', value: carUrl })}>🖨 {t('printOne')}</button>
                </div>
              </div>
            )}
            {tables.map((tb) => {
              const url = customerUrlOf(tb);
              return (
                <div className="tcard" key={tb.id}>
                  <div className="tcard-hd"><span className="tnum num">{tb.tableNumber}</span>{!tb.active && <span className="chip">off</span>}</div>
                  <div className="qrtile"><BrandedQrCode value={url} size={150} /></div>
                  <button className="tlink" title={url} onClick={() => { navigator.clipboard?.writeText(url); toast(t('copied')); }}>{t('copy')} ⧉</button>
                  <ActivityRow liveKey={tb.qrCodeToken} todayKey={String(tb.id)} />
                  <div className="tcard-actions">
                    <button className="btn sm ghost" onClick={() => printOne({ title: `${t('table')} ${tb.tableNumber}`, subtitle: slugOf(tb), value: url })}>🖨 {t('printOne')}</button>
                    <button className="btn sm ghost" onClick={() => { if (confirm(t('regenWarn'))) regen.mutate(tb.id); }}>↻ {t('regenerate')}</button>
                    <button className="btn sm danger" onClick={() => { if (confirm(t('delWarn'))) del.mutate(tb.id); }}>{t('del')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* printable table tents (portal → outside .dash so print can show only this) */}
      {createPortal(
        singlePrint ? (
          <div className="print-single-sheet">
            {singlePrint.subtitle && <div className="print-single-brand">{singlePrint.subtitle}</div>}
            <div className="print-single-title">{singlePrint.title}</div>
            <div className="print-single-qr">
              <BrandedQrCode value={singlePrint.value} size={560} fgColor="#000000" marginSize={2} />
            </div>
            <div className="print-single-scan">{t('scan')}</div>
          </div>
        ) : (
          <div className="print-sheet">
            {carUrl && (
              <div className="tent" key="outdoor-car">
                <div className="tent-brand">{restaurantSlug}</div>
                <div className="tent-table">🚗 {t('carQr')}</div>
                <BrandedQrCode value={carUrl} size={210} fgColor="#000000" marginSize={2} />
                <div className="tent-scan">{t('scan')}</div>
              </div>
            )}
            {tables.map((tb) => {
              const url = customerUrlOf(tb);
              return (
                <div className="tent" key={tb.id}>
                  <div className="tent-brand">{slugOf(tb)}</div>
                  <div className="tent-table">{t('table')} {tb.tableNumber}</div>
                  <BrandedQrCode value={url} size={210} fgColor="#000000" marginSize={2} />
                  <div className="tent-scan">{t('scan')}</div>
                </div>
              );
            })}
          </div>
        ),
        document.body,
      )}
    </div>
  );
}
