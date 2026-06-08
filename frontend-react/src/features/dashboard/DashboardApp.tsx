import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api, ApiError, logout, accessTokenValue } from '../../lib/api';
import { useAuth, isManager, canAcceptOrders } from '../../lib/auth';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { useToast } from '../../lib/toast';
import { useOrderStream, type StreamStatus } from '../../lib/sse';
import { useOrderSound, SoundToggle, notify } from '../../lib/alerts';
import { useWakeLock } from '../../lib/wakeLock';
import { omr, fmtElapsed } from '../../lib/format';
import { carColorOf } from '../../lib/carColors';
import type { OrderResponse, OrderStatus, BranchResponse, TableResponse, Restaurant, QrActivity } from '../../lib/types';
import { DEMO } from '../../lib/demo';
import { BRAND } from '../../lib/brand';
import Login from '../auth/Login';
import MenuManager, { MenuLookManager } from './MenuManager';
import OrdersPage from './OrdersPage';
import RestaurantProfile from './RestaurantProfile';
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
        print: 'طباعة الكل', printOne: 'طباعة الرمز', regenerate: 'تجديد الرمز', del: 'حذف', scan: 'امسح للطلب', copy: 'نسخ الرابط', copied: 'تم النسخ', carQr: 'رمز سيارات الخارج',
        noTables: 'لا توجد طاولات بعد', regenWarn: 'سيتوقف الرمز القديم عن العمل. متابعة؟', delWarn: 'حذف هذه الطاولة؟',
        reconnect: 'إعادة الاتصال…', newOrder: 'طلب جديد', newOrders: 'طلبات جديدة', tapView: 'اضغط للعرض',
        loginTitle: 'لوحة Serva.', loginSub: 'سجّل الدخول لإدارة الطلبات المباشرة', saved: 'تم الحفظ',
        orderingNow: 'يطلبون الآن', qaNow: 'الآن', qaToday: 'اليوم', qaOrders: 'طلب' },
  en: { title: 'Kitchen Display', live: 'Live', logoutT: 'Logout', cur: 'OMR', min: 'min', empty: 'No orders',
        nav_board: 'Live orders', nav_tables: 'Tables & QR', nav_orders: 'Order history', nav_menu: 'Menu', nav_look: 'Customer menu look', nav_profile: 'Restaurant profile',
        col_PENDING: 'New', col_ACCEPTED: 'Accepted', col_PREPARING: 'Preparing', col_READY: 'Ready',
        table: 'Table', takeaway: 'Takeaway', car: 'Outdoor car', note: 'Note',
        accept: 'Accept', decline: 'Decline', startPrep: 'Start preparing', ready: 'Ready', complete: 'Complete', cancel: 'Cancel',
        unpaid: 'Mark paid', paid: 'Paid', confirm: 'Confirm', back: 'Back',
        acceptT: 'Accept order', acceptP: 'How many minutes to prepare?', declineT: 'Decline order', declineP: 'Reason (shown to customer)',
        cancelT: 'Cancel order', cancelP: 'Cancel reason (optional)', reason: 'Reason',
        tablesTitle: 'Tables & QR codes', addTable: '＋ Table', tableNumber: 'Table number', add: 'Add',
        print: 'Print all', printOne: 'Print QR', regenerate: 'Regenerate', del: 'Delete', scan: 'Scan to order', copy: 'Copy link', copied: 'Copied', carQr: 'Outdoor car QR',
        noTables: 'No tables yet', regenWarn: 'The old QR will stop working. Continue?', delWarn: 'Delete this table?',
        reconnect: 'Reconnecting…', newOrder: 'New order', newOrders: 'new orders', tapView: 'Tap to view',
        loginTitle: 'Serva. dashboard', loginSub: 'Sign in to manage live orders', saved: 'Saved',
        orderingNow: 'ordering now', qaNow: 'now', qaToday: 'Today', qaOrders: 'orders' },
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
    return <Login mark={BRAND.name} title={t('loginTitle')} subtitle={t('loginSub')} demo={{ email: DEMO.ownerEmail, password: DEMO.ownerPassword }} />;
  }
  return <Shell />;
}

type Page = 'board' | 'orders' | 'menu' | 'look' | 'profile' | 'tables';

function Shell() {
  const { user } = useAuth();
  const t = useT(DICT);
  const role = user!.role;
  const [page, setPage] = useState<Page>('board');
  const sound = useOrderSound();
  const [stream, setStream] = useState<StreamStatus>('connecting');
  const titles: Record<string, string> = { board: t('title'), orders: t('nav_orders'), menu: t('nav_menu'), look: t('nav_look'), profile: t('nav_profile'), tables: t('tablesTitle') };

  const navItems = ([
    { key: 'board', icon: '🍳', label: t('nav_board'), show: true },
    { key: 'orders', icon: '🧾', label: t('nav_orders'), show: true },
    { key: 'menu', icon: '📋', label: t('nav_menu'), show: isManager(role) },
    { key: 'look', icon: '🎨', label: t('nav_look'), show: isManager(role) },
    { key: 'profile', icon: '🏪', label: t('nav_profile'), show: isManager(role) },
    { key: 'tables', icon: '🔳', label: t('nav_tables'), show: isManager(role) },
  ] as { key: Page; icon: string; label: string; show: boolean }[]).filter((i) => i.show);

  const { data: branchesRaw } = useQuery({
    queryKey: ['branches', user!.restaurantId],
    queryFn: () => api.get<any>(`/api/restaurants/${user!.restaurantId}/branches`),
    enabled: isManager(role) && !!user!.restaurantId,
  });
  const branches: BranchResponse[] = Array.isArray(branchesRaw) ? branchesRaw : branchesRaw?.content ?? [];

  const [branchId, setBranchId] = useState<number | undefined>(user!.branchId ?? undefined);
  useEffect(() => { if (branchId == null && branches.length) setBranchId(branches[0].id); }, [branches]); // eslint-disable-line

  const initials = user!.fullName.split(' ').map((s) => s[0]).slice(0, 2).join('');

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
          {page === 'board' && (
            stream === 'open'
              ? <span className="dlive"><span className="d" />{t('live')}</span>
              : <span className="dlive off"><span className="d" />{t('reconnect')}</span>
          )}
          <div className="spacer" />
          {isManager(role) && branches.length > 0 && (
            <select className="select" value={branchId ?? ''} onChange={(e) => setBranchId(Number(e.target.value))}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <SoundToggle soundOn={sound.soundOn} onToggle={sound.toggle} />
          <ThemeToggle />
          <LangToggle />
          <div className="who"><div className="av">{initials}</div><div className="who-txt"><div className="nm">{user!.fullName}</div><div className="rl">{role}</div></div></div>
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

  const token = accessTokenValue();
  const streamUrl = branchId && token ? `/api/dashboard/orders/stream?branchId=${branchId}&access_token=${encodeURIComponent(token)}` : null;
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
    onStatus,
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
                    onPay={() => pay.mutate(o.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

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

function OrderCard({ o, tableNo, t, lang, canAccept, onAccept, onDecline, onCancel, onPreparing, onReady, onComplete, onPay }: any) {
  const el = fmtElapsed(o.createdAt);
  const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
  const where = o.orderType === 'DINE_IN'
    ? <span className="where">🪑 <span className="tg">{t('table')} {o.tableId ? (tableNo.get(o.tableId) ?? o.tableId) : ''}</span></span>
    : o.orderType === 'CAR'
      ? <span className="where">🚗 <span className="tg">{t('car')}{o.carPlate ? ` · ${o.carPlate}` : ''}</span><CarColorTag color={o.carColor} lang={lang} /></span>
    : <span className="where">🥡 <span className="tg">{t('takeaway')}</span></span>;
  return (
    <div className="ocard">
      <div className="ocard-top"><span className="ordno">{o.orderNumber}</span><span className={'elapsed' + (mins > 10 ? ' late' : mins > 5 ? ' warn' : '')}>{el}</span></div>
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
const servaQrLogo = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 44">
  <rect width="120" height="44" rx="10" fill="white"/>
  <text x="60" y="29" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="23" font-weight="800" fill="#10b981">Serva.</text>
</svg>
`)}`;

function BrandedQrCode({ value, size, fgColor = '#0E0F12', marginSize = 1 }: { value: string; size: number; fgColor?: string; marginSize?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor={fgColor}
      level="H"
      marginSize={marginSize}
      imageSettings={{
        src: servaQrLogo,
        width: Math.round(size * 0.3),
        height: Math.round(size * 0.13),
        excavate: true,
      }}
    />
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
  useEffect(() => {
    if (!branchId) return;
    const token = accessTokenValue();
    const url = `/api/dashboard/qr-activity/stream?branchId=${branchId}${token ? `&access_token=${encodeURIComponent(token)}` : ''}`;
    const es = new EventSource(url);
    const onMsg = (e: MessageEvent) => {
      try { qc.setQueryData(['qr-activity', branchId], JSON.parse(e.data) as QrActivity); } catch { /* ignore */ }
    };
    es.addEventListener('qr-activity', onMsg as EventListener);
    return () => { es.removeEventListener('qr-activity', onMsg as EventListener); es.close(); };
  }, [branchId, qc]);
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

