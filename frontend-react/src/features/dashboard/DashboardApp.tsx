import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api, ApiError, logout, accessTokenValue } from '../../lib/api';
import { useAuth, isManager, canAcceptOrders } from '../../lib/auth';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { useToast } from '../../lib/toast';
import { useOrderStream } from '../../lib/sse';
import { omr, fmtElapsed } from '../../lib/format';
import type { OrderResponse, OrderStatus, BranchResponse, TableResponse } from '../../lib/types';
import { DEMO } from '../../lib/demo';
import Login from '../auth/Login';
import MenuManager from './MenuManager';
import OrdersPage from './OrdersPage';
import './dashboard.css';

const DICT: Dict = {
  ar: { title: 'شاشة المطبخ — مباشر', live: 'مباشر', logoutT: 'خروج', cur: 'ر.ع', min: 'د', empty: 'لا طلبات',
        nav_board: 'الطلبات المباشرة', nav_tables: 'الطاولات ورموز QR', nav_orders: 'سجل الطلبات', nav_menu: 'إدارة القائمة',
        col_PENDING: 'جديد', col_ACCEPTED: 'مقبول', col_PREPARING: 'قيد التحضير', col_READY: 'جاهز',
        table: 'طاولة', takeaway: 'سفري', note: 'ملاحظة',
        accept: 'قبول', decline: 'رفض', startPrep: 'بدء التحضير', ready: 'جاهز', complete: 'اكتمل', cancel: 'إلغاء',
        unpaid: 'تحديد كمدفوع', paid: 'مدفوع', confirm: 'تأكيد', back: 'رجوع',
        acceptT: 'قبول الطلب', acceptP: 'كم دقيقة للتحضير؟', declineT: 'رفض الطلب', declineP: 'سبب الرفض (يظهر للعميل)',
        cancelT: 'إلغاء الطلب', cancelP: 'سبب الإلغاء (اختياري)', reason: 'السبب',
        tablesTitle: 'الطاولات ورموز QR', addTable: '＋ طاولة', tableNumber: 'رقم الطاولة', add: 'إضافة',
        print: 'طباعة الكل', regenerate: 'تجديد الرمز', del: 'حذف', scan: 'امسح للطلب', copy: 'نسخ الرابط', copied: 'تم النسخ',
        noTables: 'لا توجد طاولات بعد', regenWarn: 'سيتوقف الرمز القديم عن العمل. متابعة؟', delWarn: 'حذف هذه الطاولة؟',
        loginTitle: 'لوحة تحكم المقهى', loginSub: 'سجّل الدخول لإدارة الطلبات المباشرة' },
  en: { title: 'Kitchen Display — Live', live: 'Live', logoutT: 'Logout', cur: 'OMR', min: 'min', empty: 'No orders',
        nav_board: 'Live orders', nav_tables: 'Tables & QR', nav_orders: 'Order history', nav_menu: 'Menu',
        col_PENDING: 'New', col_ACCEPTED: 'Accepted', col_PREPARING: 'Preparing', col_READY: 'Ready',
        table: 'Table', takeaway: 'Takeaway', note: 'Note',
        accept: 'Accept', decline: 'Decline', startPrep: 'Start preparing', ready: 'Ready', complete: 'Complete', cancel: 'Cancel',
        unpaid: 'Mark paid', paid: 'Paid', confirm: 'Confirm', back: 'Back',
        acceptT: 'Accept order', acceptP: 'How many minutes to prepare?', declineT: 'Decline order', declineP: 'Reason (shown to customer)',
        cancelT: 'Cancel order', cancelP: 'Cancel reason (optional)', reason: 'Reason',
        tablesTitle: 'Tables & QR codes', addTable: '＋ Table', tableNumber: 'Table number', add: 'Add',
        print: 'Print all', regenerate: 'Regenerate', del: 'Delete', scan: 'Scan to order', copy: 'Copy link', copied: 'Copied',
        noTables: 'No tables yet', regenWarn: 'The old QR will stop working. Continue?', delWarn: 'Delete this table?',
        loginTitle: 'Cafe dashboard', loginSub: 'Sign in to manage live orders' },
};

const COLS: { st: OrderStatus; color: string }[] = [
  { st: 'PENDING', color: 'var(--pending)' },
  { st: 'ACCEPTED', color: 'var(--accepted)' },
  { st: 'PREPARING', color: 'var(--preparing)' },
  { st: 'READY', color: 'var(--ready)' },
];

export default function DashboardApp() {
  const { user, authed } = useAuth();
  const t = useT(DICT);
  if (!authed || !user) {
    return <Login mark="☕" title={t('loginTitle')} subtitle={t('loginSub')} demo={{ email: DEMO.ownerEmail, password: DEMO.ownerPassword }} />;
  }
  return <Shell />;
}

function Shell() {
  const { user } = useAuth();
  const t = useT(DICT);
  const role = user!.role;
  const [page, setPage] = useState<'board' | 'orders' | 'menu' | 'tables'>('board');
  const titles: Record<string, string> = { board: t('title'), orders: t('nav_orders'), menu: t('nav_menu'), tables: t('tablesTitle') };

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
        <div className="logo">☕</div>
        <nav className="nav">
          <button className={page === 'board' ? 'on' : ''} onClick={() => setPage('board')}>🍳<span className="tip">{t('nav_board')}</span></button>
          <button className={page === 'orders' ? 'on' : ''} onClick={() => setPage('orders')}>🧾<span className="tip">{t('nav_orders')}</span></button>
          {isManager(role) && <button className={page === 'menu' ? 'on' : ''} onClick={() => setPage('menu')}>📋<span className="tip">{t('nav_menu')}</span></button>}
          {isManager(role) && <button className={page === 'tables' ? 'on' : ''} onClick={() => setPage('tables')}>🔳<span className="tip">{t('nav_tables')}</span></button>}
        </nav>
        <button className="out" title={t('logoutT')} onClick={() => logout()}>⏻</button>
      </aside>

      <div className="dmain">
        <div className="dtop">
          <h2>{titles[page]}</h2>
          {page === 'board' && <span className="dlive"><span className="d" />{t('live')}</span>}
          <div className="spacer" />
          {isManager(role) && branches.length > 0 && (
            <select className="select" value={branchId ?? ''} onChange={(e) => setBranchId(Number(e.target.value))}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <ThemeToggle />
          <LangToggle />
          <div className="who"><div className="av">{initials}</div><div><div className="nm">{user!.fullName}</div><div className="rl">{role}</div></div></div>
        </div>

        {page === 'board' && <KdsBoard branchId={branchId} />}
        {page === 'orders' && <OrdersPage branchId={branchId} />}
        {page === 'menu' && <MenuManager />}
        {page === 'tables' && <TablesPage branchId={branchId} />}
      </div>
    </div>
  );
}

/* ============================ KDS BOARD ============================ */
type Modal = { type: 'accept' | 'decline' | 'cancel'; order: OrderResponse } | null;

function KdsBoard({ branchId }: { branchId?: number }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const role = user!.role;

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

  const token = accessTokenValue();
  const streamUrl = branchId && token ? `/api/dashboard/orders/stream?branchId=${branchId}&access_token=${encodeURIComponent(token)}` : null;
  useOrderStream(streamUrl, (name) => { qc.invalidateQueries({ queryKey: liveKey }); if (name === 'order.created') beep(); });

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
      <div className="board">
        {COLS.map((c) => {
          const list = orders.filter((o) => o.status === c.st);
          return (
            <div className="col" key={c.st} style={{ ['--col' as any]: c.color }}>
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

function OrderCard({ o, tableNo, t, lang, canAccept, onAccept, onDecline, onCancel, onPreparing, onReady, onComplete, onPay }: any) {
  const el = fmtElapsed(o.createdAt);
  const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
  const where = o.orderType === 'DINE_IN'
    ? <span className="where">🪑 <span className="tg">{t('table')} {o.tableId ? (tableNo.get(o.tableId) ?? o.tableId) : ''}</span></span>
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
const slugOf = (tb: TableResponse) => { try { return new URL(tb.qrCodeUrl!).pathname.split('/')[2] ?? ''; } catch { return ''; } };

function TablesPage({ branchId }: { branchId?: number }) {
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const [num, setNum] = useState('');

  const { data: raw, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get<any>(`/api/branches/${branchId}/tables`),
    enabled: !!branchId,
  });
  const tables: TableResponse[] = Array.isArray(raw) ? raw : raw?.content ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tables', branchId] });

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

  if (!branchId) return <div className="placeholder"><div><div className="ic">🏬</div><p>—</p></div></div>;

  return (
    <div className="tables-wrap no-print">
      <div className="tables-tool">
        <form className="addtable" onSubmit={(e) => { e.preventDefault(); if (num.trim()) create.mutate(); }}>
          <input className="input" style={{ maxWidth: 160 }} value={num} onChange={(e) => setNum(e.target.value)} placeholder={t('tableNumber')} />
          <button className="btn sm" disabled={!num.trim() || create.isPending}>{t('add')}</button>
        </form>
        <div style={{ flex: 1 }} />
        <button className="btn sm ghost" disabled={!tables.length} onClick={() => window.print()}>🖨 {t('print')}</button>
      </div>

      {isLoading ? <div className="center"><div className="spinner" /></div>
        : tables.length === 0 ? <div className="empty"><div className="big">🪑</div><h3>{t('noTables')}</h3></div>
        : (
          <div className="tcards">
            {tables.map((tb) => {
              const url = customerUrlOf(tb);
              return (
                <div className="tcard" key={tb.id}>
                  <div className="tcard-hd"><span className="tnum num">{tb.tableNumber}</span>{!tb.active && <span className="chip">off</span>}</div>
                  <div className="qrtile"><QRCodeSVG value={url} size={150} bgColor="#ffffff" fgColor="#0E0F12" level="M" marginSize={1} /></div>
                  <button className="tlink" title={url} onClick={() => { navigator.clipboard?.writeText(url); toast(t('copied')); }}>{t('copy')} ⧉</button>
                  <div className="tcard-actions">
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
        <div className="print-sheet">
          {tables.map((tb) => {
            const url = customerUrlOf(tb);
            return (
              <div className="tent" key={tb.id}>
                <div className="tent-brand">{slugOf(tb)}</div>
                <div className="tent-table">{t('table')} {tb.tableNumber}</div>
                <QRCodeSVG value={url} size={210} bgColor="#ffffff" fgColor="#000000" level="M" marginSize={2} />
                <div className="tent-scan">{t('scan')}</div>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

let audioCtx: AudioContext | null = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination); o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    o.start(); o.stop(audioCtx.currentTime + 0.36);
  } catch { /* ignore */ }
}
