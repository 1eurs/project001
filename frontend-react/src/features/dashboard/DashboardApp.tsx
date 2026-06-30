import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create as createQrMatrix } from 'qrcode/lib/core/qrcode.js';
import { api, ApiError, logout, accessTokenValue, changeEmail, freshStreamToken, onAuthChange } from '../../lib/api';
import { useAuth, isManager, canAcceptOrders, can } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { useOrderStream, type StreamStatus } from '../../lib/sse';
import { useOrderSound, SoundToggle, notify, closeNotify } from '../../lib/alerts';
import { useWakeLock } from '../../lib/wakeLock';
import { fmtElapsed } from '../../lib/format';
import { Money } from '../../lib/Money';
import { carColorOf } from '../../lib/carColors';
import type { OrderResponse, OrderStatus, BranchResponse, TableResponse, Restaurant, QrActivity, QrCartItem } from '../../lib/types';
import { BRAND } from '../../lib/brand';
import { ensureGoogleFonts, BOLD_FONTS } from '../../lib/fonts';
import Login from '../auth/Login';
import MenuManager, { MenuLookManager } from './MenuManager';
import OrdersPage from './OrdersPage';
import RestaurantProfile from './RestaurantProfile';
import TeamPage from './TeamPage';
// Analytics pulls in recharts + motion (~150KB gzipped), so code-split it — staff on the
// live board never download those bytes unless they open the analytics tab.
const AnalyticsPage = lazy(() => import('./AnalyticsPage'));
import OrderPad from './OrderPad';
import InvoicePrint from './InvoicePrint';
import LoyaltyPage from './LoyaltyPage';
import LoyaltySetup from './LoyaltySetup';
import './dashboard.css';

const DICT: Dict = {
  ar: { title: 'شاشة المطبخ', live: 'مباشر', logoutT: 'خروج', cur: 'ر.ع', min: 'د', empty: 'لا طلبات',
        nav_board: 'الطلبات المباشرة', nav_tables: 'الطاولات ورموز QR', nav_orders: 'سجل الطلبات', nav_menu: 'إدارة القائمة', nav_look: 'شكل قائمة العملاء', nav_team: 'الفريق', nav_analytics: 'التحليلات', nav_neworder: 'طلب جديد', nav_profile: 'ملف المطعم', nav_loyalty: 'الولاء', nav_loyaltySetup: 'إعدادات الولاء', more: 'المزيد',
        col_PENDING: 'جديد', col_ACCEPTED: 'قيد التنفيذ', col_PREPARING: 'قيد التحضير', col_READY: 'جاهز',
        table: 'طاولة', car: 'خدمة السيارة', note: 'ملاحظة', loyaltyReward: 'مكافأة ولاء',
        paymentTitle: 'كيف دفع العميل؟', paymentSub: 'اختر طريقة الدفع قبل إنهاء الطلب.', paymentCash: 'نقداً', paymentCard: 'بطاقة / فيزا',
        accept: 'قبول', decline: 'رفض', startPrep: 'بدء التحضير', ready: 'جاهز', complete: 'اكتمل', cancel: 'إلغاء',
        collect: 'حصّل', done: 'تم', doneUnpaid: 'تم دون دفع',
        unpaid: 'تحديد كمدفوع', paid: 'مدفوع', confirm: 'تأكيد', back: 'رجوع',
        acceptT: 'قبول الطلب', acceptP: 'كم دقيقة للتحضير؟', declineT: 'رفض الطلب', declineP: 'سبب الرفض (اختياري، يظهر للعميل)',
        cancelT: 'إلغاء الطلب', cancelP: 'سبب الإلغاء (اختياري)', reason: 'السبب',
        tablesTitle: 'الطاولات ورموز QR', addTable: '＋ طاولة', tableNumber: 'رقم الطاولة', add: 'إضافة',
        print: 'طباعة الكل', printOne: 'طباعة الرمز', printInv: 'طباعة الفاتورة', regenerate: 'تجديد الرمز', del: 'حذف', scan: 'امسح للطلب', copy: 'نسخ الرابط', copied: 'تم النسخ', carQr: 'رمز سيارات الخارج',
        noTables: 'لا توجد طاولات بعد', regenWarn: 'سيتوقف الرمز القديم عن العمل. متابعة؟', delWarn: 'حذف هذه الطاولة؟',
        syncing: 'مزامنة الطلبات', autoRefresh: 'التحديث التلقائي يعمل', newOrder: 'طلب جديد', newOrders: 'طلبات جديدة', tapView: 'اضغط للعرض',
        loginTitle: 'لوحة Serva.', loginSub: 'سجّل الدخول لإدارة الطلبات المباشرة', saved: 'تم الحفظ',
        orderingNow: 'يطلبون الآن', qaNow: 'الآن', qaToday: 'اليوم', qaOrders: 'طلب',
        qaLive: 'سلات نشطة', qaViewing: 'يتصفح', qaOrdering: 'في السلة الآن', qaCart: 'الأصناف',
        qaCartHint: 'محتوى السلة الآن — قد يتغير قبل إرسال الطلب',
        account: 'الحساب', email: 'البريد', language: 'اللغة', branch: 'الفرع', arabic: 'العربية', english: 'English', changePassword: 'تغيير كلمة المرور', changeEmail: 'تغيير البريد الإلكتروني',
        ordersOpen: 'يستقبل الطلبات', ordersPaused: 'الطلبات متوقفة', pauseOrders: 'إيقاف الطلبات', resumeOrders: 'استئناف الطلبات',
        pauseTitle: 'إيقاف طلبات العملاء؟', pauseMessage: 'سيتمكن العملاء من تصفح القائمة، لكن لن يتمكنوا من إضافة أصناف أو إرسال طلب جديد لهذا الفرع.', pauseConfirm: 'إيقاف الطلبات',
        ordersPausedToast: 'تم إيقاف طلبات العملاء', ordersResumedToast: 'تم استئناف طلبات العملاء',
        changePwSub: 'أدخل كلمة المرور الحالية ثم الجديدة.', currentPw: 'كلمة المرور الحالية',
        changeEmailSub: 'أدخل كلمة المرور الحالية والبريد الجديد.', newEmail: 'البريد الجديد',
        newPw: 'كلمة المرور الجديدة', confirmPw: 'تأكيد كلمة المرور', save: 'حفظ',
        pwChanged: 'تم تغيير كلمة المرور', pwTooShort: 'كلمة المرور 8 أحرف على الأقل', pwMismatch: 'كلمتا المرور غير متطابقتين',
        emailChanged: 'تم تغيير البريد الإلكتروني', emailInvalid: 'أدخل بريدًا صحيحًا',
        role_owner: 'مالك المطعم', role_staff: 'موظف' },
  en: { title: 'Kitchen Display', live: 'Live', logoutT: 'Logout', cur: 'OMR', min: 'min', empty: 'No orders',
        nav_board: 'Live orders', nav_tables: 'Tables & QR', nav_orders: 'Order history', nav_menu: 'Menu', nav_look: 'Customer menu look', nav_team: 'Team', nav_analytics: 'Analytics', nav_neworder: 'New order', nav_profile: 'Restaurant profile', nav_loyalty: 'Loyalty', nav_loyaltySetup: 'Loyalty settings', more: 'More',
        col_PENDING: 'New', col_ACCEPTED: 'In progress', col_PREPARING: 'Preparing', col_READY: 'Ready',
        table: 'Table', car: 'Outdoor car', note: 'Note', loyaltyReward: 'Loyalty reward',
        paymentTitle: 'How did the customer pay?', paymentSub: 'Choose the payment method before completing the order.', paymentCash: 'Cash', paymentCard: 'Card / Visa',
        accept: 'Accept', decline: 'Decline', startPrep: 'Start preparing', ready: 'Ready', complete: 'Complete', cancel: 'Cancel',
        collect: 'Collect', done: 'Done', doneUnpaid: 'Done, unpaid',
        unpaid: 'Mark paid', paid: 'Paid', confirm: 'Confirm', back: 'Back',
        acceptT: 'Accept order', acceptP: 'How many minutes to prepare?', declineT: 'Decline order', declineP: 'Reason (optional, shown to customer)',
        cancelT: 'Cancel order', cancelP: 'Cancel reason (optional)', reason: 'Reason',
        tablesTitle: 'Tables & QR codes', addTable: '＋ Table', tableNumber: 'Table number', add: 'Add',
        print: 'Print all', printOne: 'Print QR', printInv: 'Print invoice', regenerate: 'Regenerate', del: 'Delete', scan: 'Scan to order', copy: 'Copy link', copied: 'Copied', carQr: 'Outdoor car QR',
        noTables: 'No tables yet', regenWarn: 'The old QR will stop working. Continue?', delWarn: 'Delete this table?',
        syncing: 'Syncing orders', autoRefresh: 'Auto-refresh on', newOrder: 'New order', newOrders: 'new orders', tapView: 'Tap to view',
        loginTitle: 'Serva. dashboard', loginSub: 'Sign in to manage live orders', saved: 'Saved',
        orderingNow: 'ordering now', qaNow: 'now', qaToday: 'Today', qaOrders: 'orders',
        qaLive: 'Active carts', qaViewing: 'Viewing', qaOrdering: 'in cart now', qaCart: 'Items',
        qaCartHint: 'In their cart right now — may change before the order is placed',
        account: 'Account', email: 'Email', language: 'Language', branch: 'Branch', arabic: 'Arabic', english: 'English', changePassword: 'Change password', changeEmail: 'Change email',
        ordersOpen: 'Accepting orders', ordersPaused: 'Orders paused', pauseOrders: 'Pause orders', resumeOrders: 'Resume orders',
        pauseTitle: 'Pause customer orders?', pauseMessage: 'Customers can still browse the menu, but they cannot add items or submit a new order for this branch.', pauseConfirm: 'Pause orders',
        ordersPausedToast: 'Customer orders paused', ordersResumedToast: 'Customer orders resumed',
        changePwSub: 'Enter your current password, then a new one.', currentPw: 'Current password',
        changeEmailSub: 'Enter your current password and new email.', newEmail: 'New email',
        newPw: 'New password', confirmPw: 'Confirm new password', save: 'Save',
        pwChanged: 'Password changed', pwTooShort: 'Use at least 8 characters', pwMismatch: 'Passwords don’t match',
        emailChanged: 'Email changed', emailInvalid: 'Enter a valid email',
        role_owner: 'Owner', role_staff: 'Staff' },
};

const COLS: { st: OrderStatus; color: string }[] = [
  { st: 'PENDING', color: 'var(--pending)' },
  { st: 'ACCEPTED', color: 'var(--accepted)' },
  { st: 'READY', color: 'var(--ready)' },
];
// statuses that belong on the live board; anything else has left it (completed/cancelled)
const LIVE_SET = new Set<OrderStatus>(['PENDING', 'ACCEPTED', 'READY']);

export default function DashboardApp() {
  const { user, authed } = useAuth();
  const t = useT(DICT);
  useEffect(() => { ensureGoogleFonts(BOLD_FONTS); }, []);
  if (!authed || !user) {
    return <Login mark={BRAND.name} title={t('loginTitle')} subtitle={t('loginSub')} />;
  }
  if (can(user, 'PLATFORM_ADMIN')) {
    return <Navigate to="/admin" replace />;
  }
  return <Shell />;
}

type Page = 'board' | 'neworder' | 'orders' | 'menu' | 'look' | 'team' | 'analytics' | 'profile' | 'tables' | 'loyalty' | 'loyaltySetup';

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

/* The live order stream + new-order alerts live at the Shell level — NOT inside the
   board — so a new order rings, buzzes and notifies on EVERY tab (menu, analytics,
   team…), not only while the kitchen display happens to be open. The board just reads
   the same react-query cache this stream keeps warm.
   Returns the connection status (for the live pill), the unacknowledged count (for the
   shell banner) and a clear(). */
function useLiveOrderAlerts(branchId: number | undefined, ping: () => void, t: (k: string) => string) {
  const qc = useQueryClient();
  const liveKey = ['live', branchId ?? 'all'];
  const [stream, setStream] = useState<StreamStatus>('connecting');
  const [unacked, setUnacked] = useState(0);
  const lastFallbackRefresh = useRef(0);
  const prevStreamStatus = useRef<StreamStatus | null>(null);

  // EventSource bakes the JWT into its URL and can't change it on auto-reconnect, so when
  // the token rotates (or expires mid-stream) we rebuild the URL and the effect reconnects.
  const [streamToken, setStreamToken] = useState(accessTokenValue);
  useEffect(() => onAuthChange(() => setStreamToken(accessTokenValue())), []);
  const streamUrl = branchId && streamToken
    ? `/api/dashboard/orders/stream?branchId=${branchId}&access_token=${encodeURIComponent(streamToken)}`
    : null;

  const handleStreamStatus = (status: StreamStatus) => {
    setStream(status);
    const prev = prevStreamStatus.current;
    prevStreamStatus.current = status;
    if (status === 'open') {
      // Back after a real drop → resync once; events from the gap never replay on their own.
      if (prev === 'reconnecting') qc.invalidateQueries({ queryKey: liveKey });
      return;
    }
    const now = Date.now();
    if (now - lastFallbackRefresh.current > 5_000) {
      lastFallbackRefresh.current = now;
      qc.invalidateQueries({ queryKey: liveKey });
      // An expired JWT is the other common drop cause — swap in a fresh one if needed.
      freshStreamToken().then((tk) => { if (tk) setStreamToken((p) => (tk !== p ? tk : p)); });
    }
  };

  useOrderStream(
    streamUrl,
    (name, data) => {
      // Apply the payload straight to the cache so the board (when open) updates instantly.
      const o = data as OrderResponse | null;
      if (o && typeof o.id === 'number') {
        const updated = qc.setQueryData<OrderResponse[]>(liveKey, (prev = []) => {
          const rest = prev.filter((x) => x.id !== o.id);
          if (!LIVE_SET.has(o.status)) return rest; // moved to a terminal status → drop
          return [...rest, o].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        });
        // If an order left the live set and nothing is left pending, clear the badge.
        if (!LIVE_SET.has(o.status) && (updated?.length ?? 0) === 0) setUnacked(0);
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
  useEffect(() => { if (unacked === 0) closeNotify(); }, [unacked]);
  useEffect(() => {
    const onVis = () => { if (!document.hidden) setUnacked(0); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Keep ringing every ~12s while new orders sit unacknowledged (staff stepped away),
  // stopping the moment they're acknowledged / the tab refocuses — capped so it never nags forever.
  useEffect(() => {
    if (unacked <= 0) return;
    let rings = 0;
    const id = setInterval(() => {
      if (++rings > 5) { clearInterval(id); return; }
      ping();
    }, 12_000);
    return () => clearInterval(id);
  }, [unacked > 0, ping]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stream, unacked, clear: useCallback(() => setUnacked(0), []) };
}

/* Monochrome line icons (Lucide-style) for the rail. Drawn inline so we add no
   icon dependency, and stroked with currentColor so — unlike the old emoji — they
   pick up the rail's muted / hover / active-ink states (incl. ink-on-lime in the
   neo theme). Sized in `em` so they ride the button font-size (rail 20px, bottom
   nav 19px). */
function Ico({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {children}
    </svg>
  );
}
const IcLive = () => <Ico><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" /></Ico>;
const IcNew = () => <Ico><path d="M12 5v14M5 12h14" /></Ico>;
const IcHistory = () => <Ico><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8M16 12H8M13 16H8" /></Ico>;
const IcAnalytics = () => <Ico><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></Ico>;
const IcMenu = () => <Ico><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></Ico>;
const IcLook = () => <Ico><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" /></Ico>;
const IcTables = () => <Ico><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" /></Ico>;
const IcTeam = () => <Ico><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Ico>;
const IcPower = () => <Ico><path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04" /></Ico>;
const IcLoyalty = () => <Ico><path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20l1.1-6.5L2.6 8.8l6.5-.9z" /></Ico>;
const IcMore = () => <Ico><rect width="7" height="7" x="3" y="3" rx="1.5" /><rect width="7" height="7" x="14" y="3" rx="1.5" /><rect width="7" height="7" x="14" y="14" rx="1.5" /><rect width="7" height="7" x="3" y="14" rx="1.5" /></Ico>;

function Shell() {
  const { user } = useAuth();
  const t = useT(DICT);
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState<Page>('board');
  // bumped on a banner tap so the (already-mounted) board jumps to the New column
  const [focusBoard, setFocusBoard] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const sound = useOrderSound();
  const titles: Record<string, string> = { board: t('title'), neworder: t('nav_neworder'), orders: t('nav_orders'), menu: t('nav_menu'), look: t('nav_look'), team: t('nav_team'), analytics: t('nav_analytics'), profile: t('nav_profile'), tables: t('tablesTitle'), loyalty: t('nav_loyalty'), loyaltySetup: t('nav_loyaltySetup') };

  // Ordered by daily workflow: run the floor (live → new → history), read the
  // numbers (analytics), then set things up (menu → look → tables → team).
  const navItems = ([
    { key: 'board', icon: <IcLive />, label: t('nav_board'), show: can(user, 'ORDERS') },
    { key: 'neworder', icon: <IcNew />, label: t('nav_neworder'), show: can(user, 'ORDERS') },
    { key: 'orders', icon: <IcHistory />, label: t('nav_orders'), show: can(user, 'ORDERS') },
    { key: 'analytics', icon: <IcAnalytics />, label: t('nav_analytics'), show: can(user, 'ANALYTICS') },
    { key: 'loyalty', icon: <IcLoyalty />, label: t('nav_loyalty'), show: can(user, 'PROFILE') },
    { key: 'menu', icon: <IcMenu />, label: t('nav_menu'), show: can(user, 'MENU') },
    { key: 'look', icon: <IcLook />, label: t('nav_look'), show: can(user, 'MENU') },
    { key: 'tables', icon: <IcTables />, label: t('nav_tables'), show: can(user, 'QR_TABLES') },
    { key: 'team', icon: <IcTeam />, label: t('nav_team'), show: can(user, 'TEAM') },
  ] as { key: Page; icon: ReactNode; label: string; show: boolean }[]).filter((i) => i.show);

  // Phone bottom bar holds at most 5 items; anything past that moves into a "More" sheet so
  // touch targets stay big and nothing hides off-screen. Few-permission staff keep all tabs.
  const BOTTOM_MAX = 5;
  const hasOverflow = navItems.length > BOTTOM_MAX;
  const primaryNav = hasOverflow ? navItems.slice(0, BOTTOM_MAX - 1) : navItems;
  const overflowNav = hasOverflow ? navItems.slice(BOTTOM_MAX - 1) : [];
  const moreActive = overflowNav.some((i) => i.key === page);

  // Land on the first screen the user can actually open (e.g. a kitchen-only or menu-only member).
  const navKeys = navItems.map((i) => i.key).join(',');
  useEffect(() => {
    if (navItems.length && !navItems.some((i) => i.key === page)) setPage(navItems[0].key);
  }, [navKeys]); // eslint-disable-line

  const qc = useQueryClient();
  const branchesQ = useQuery({
    queryKey: ['branches', user!.restaurantId],
    queryFn: () => api.get<any>(`/api/restaurants/${user!.restaurantId}/branches`),
    enabled: isManager(user) && !!user!.restaurantId,
  });
  const branchesRaw = branchesQ.data;
  const branches: BranchResponse[] = Array.isArray(branchesRaw) ? branchesRaw : branchesRaw?.content ?? [];
  // A branch an admin has deactivated must vanish from the owner's switcher and never be the
  // working branch — customers can't reach it, so the owner shouldn't be parked on it either.
  const activeBranches = useMemo(() => branches.filter((b) => b.active), [branches]);

  const [branchId, setBranchId] = useState<number | undefined>(user!.branchId ?? undefined);
  // Keep the working branch on an active one: pick the first active branch when we have none yet
  // or when the branch we were on just got deactivated.
  useEffect(() => {
    if (!activeBranches.length) return;
    if (branchId == null || !activeBranches.some((b) => b.id === branchId)) setBranchId(activeBranches[0].id);
  }, [activeBranches]); // eslint-disable-line

  const selectedBranchQ = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => api.get<BranchResponse>(`/api/branches/${branchId}`),
    enabled: branchId != null,
  });
  const selectedBranch = selectedBranchQ.data ?? activeBranches.find((b) => b.id === branchId);
  const orderingStatus = useMutation({
    mutationFn: ({ id, acceptingOrders }: { id: number; acceptingOrders: boolean }) =>
      api.patch<BranchResponse>(`/api/branches/${id}/ordering-status`, { acceptingOrders }),
    onSuccess: (updated) => {
      qc.setQueryData(['branch', updated.id], updated);
      qc.setQueryData(['branches', user!.restaurantId], (previous: any) => {
        if (Array.isArray(previous)) {
          return previous.map((branch) => branch.id === updated.id ? updated : branch);
        }
        if (Array.isArray(previous?.content)) {
          return { ...previous, content: previous.content.map((branch: BranchResponse) => branch.id === updated.id ? updated : branch) };
        }
        return previous;
      });
      toast(t(updated.acceptingOrders ? 'ordersResumedToast' : 'ordersPausedToast'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.message : 'Error'),
  });
  const toggleOrdering = async () => {
    if (!selectedBranch || orderingStatus.isPending) return;
    const next = !selectedBranch.acceptingOrders;
    if (!next) {
      const accepted = await confirm({
        title: t('pauseTitle'),
        message: t('pauseMessage'),
        confirmLabel: t('pauseConfirm'),
        cancelLabel: t('back'),
        danger: true,
      });
      if (!accepted) return;
    }
    orderingStatus.mutate({ id: selectedBranch.id, acceptingOrders: next });
  };

  // Self-heal: a café onboarded before branches were auto-created has none — and without one
  // the Tables & QR page is dead. When an owner lands here with zero branches, provision a
  // default branch (named after the café) so QR codes work immediately.
  const canMakeBranch = can(user, 'BRANCHES');
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

  // Shell-level so order alerts fire on every tab, not just the live board.
  const alerts = useLiveOrderAlerts(branchId, sound.ping, t);
  const calmStream = useCalmStream(alerts.stream);

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
        <button className="out" title={t('logoutT')} aria-label={t('logoutT')} onClick={() => logout()}><IcPower /></button>
      </aside>

      <div className="dmain">
        <div className="dtop">
          <h2>{titles[page]}</h2>
          {page === 'board' && <LivePill stream={calmStream} t={t} />}
          <div className="spacer" />
          {page === 'board' && can(user, 'ORDERS') && (
            <button className="dnew" onClick={() => setPage('neworder')}>＋ {t('nav_neworder')}</button>
          )}
          <SoundToggle soundOn={sound.soundOn} onToggle={sound.toggle} />
          <AccountMenu
            t={t}
            showProfile={can(user, 'PROFILE')}
            profileActive={page === 'profile'}
            onProfile={() => setPage('profile')}
            showLoyaltySetup={can(user, 'PROFILE')}
            loyaltySetupActive={page === 'loyaltySetup'}
            onLoyaltySetup={() => setPage('loyaltySetup')}
            branches={isManager(user) ? activeBranches : []}
            branchId={branchId}
            onBranch={setBranchId}
            branch={selectedBranch}
            canManageOrdering={can(user, 'ORDERS')}
            orderingPending={orderingStatus.isPending}
            onToggleOrdering={toggleOrdering}
          />
        </div>

        {alerts.unacked > 0 && (
          <button className="newbanner" onClick={() => { alerts.clear(); setFocusBoard((n) => n + 1); setPage('board'); }}>
            <span className="nb-dot" />
            <b>{alerts.unacked}</b> {t('newOrders')} · {t('tapView')}
          </button>
        )}
        {page === 'board' && <KdsBoard branchId={branchId} focusSignal={focusBoard} />}
        {page === 'neworder' && <OrderPad branchId={branchId} onPlaced={() => setPage('board')} />}
        {page === 'orders' && <OrdersPage branchId={branchId} />}
        {page === 'menu' && <MenuManager />}
        {page === 'look' && <MenuLookManager branchId={branchId} />}
        {page === 'team' && <TeamPage branches={branches} branchId={branchId} />}
        {page === 'analytics' && <Suspense fallback={<div className="an-msg">…</div>}><AnalyticsPage branches={isManager(user) ? activeBranches : []} /></Suspense>}
        {page === 'profile' && <RestaurantProfile branchId={branchId} />}
        {page === 'tables' && <TablesPage branchId={branchId} />}
        {page === 'loyalty' && <LoyaltyPage onOpenSetup={() => setPage('loyaltySetup')} />}
        {page === 'loyaltySetup' && <LoyaltySetup />}
      </div>

      <nav className="dnav-bottom">
        {primaryNav.map((it) => (
          <button key={it.key} className={page === it.key ? 'on' : ''} onClick={() => setPage(it.key)}>
            <span className="ic">{it.icon}</span><span className="lb">{it.label}</span>
          </button>
        ))}
        {overflowNav.length > 0 && (
          <button className={'dnav-more' + (moreActive ? ' on' : '')} onClick={() => setMoreOpen(true)}
            aria-haspopup="menu" aria-expanded={moreOpen}>
            <span className="ic"><IcMore /></span><span className="lb">{t('more')}</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="more-sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
          <div className="more-sheet" role="menu">
            <div className="more-sheet-grip" />
            <div className="more-grid">
              {overflowNav.map((it) => (
                <button key={it.key} role="menuitem" className={'more-item' + (page === it.key ? ' on' : '')}
                  onClick={() => { setPage(it.key); setMoreOpen(false); }}>
                  <span className="more-ic">{it.icon}</span><span className="more-lb">{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ ACCOUNT MENU ============================ */
function AccountMenu({
  t,
  showProfile,
  profileActive,
  onProfile,
  showLoyaltySetup,
  loyaltySetupActive,
  onLoyaltySetup,
  branches,
  branchId,
  onBranch,
  branch,
  canManageOrdering,
  orderingPending,
  onToggleOrdering,
}: {
  t: (k: string) => string;
  showProfile: boolean;
  profileActive: boolean;
  onProfile: () => void;
  showLoyaltySetup: boolean;
  loyaltySetupActive: boolean;
  onLoyaltySetup: () => void;
  branches: BranchResponse[];
  branchId?: number;
  onBranch: (id: number) => void;
  branch?: BranchResponse;
  canManageOrdering: boolean;
  orderingPending: boolean;
  onToggleOrdering: () => void;
}) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = user!.fullName.split(' ').map((s) => s[0]).slice(0, 2).join('');
  const roleLabel = user!.owner ? t('role_owner') : t('role_staff');

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
              <div className="acct-mail" title={user!.email ?? user!.username}>{user!.email ?? user!.username}</div>
              <span className="acct-role">{roleLabel}</span>
            </div>
          </div>
          <div className="acct-sep" />
          {canManageOrdering && branch && (
            <button
              className={'acct-item order-toggle ' + (branch.acceptingOrders ? 'pause' : 'resume')}
              role="menuitem"
              disabled={orderingPending}
              onClick={() => { setOpen(false); onToggleOrdering(); }}
            >
              <span className="ai-ic"><span className="status-dot" /></span>
              <span className="order-toggle-copy">
                <b>{t(branch.acceptingOrders ? 'pauseOrders' : 'resumeOrders')}</b>
                <small>{t(branch.acceptingOrders ? 'ordersOpen' : 'ordersPaused')}</small>
              </span>
            </button>
          )}
          {canManageOrdering && branch && <div className="acct-sep" />}
          {showProfile && (
            <button className={'acct-item' + (profileActive ? ' on' : '')} role="menuitem" onClick={() => { onProfile(); setOpen(false); }}>
              <span className="ai-ic">🏪</span>{t('nav_profile')}
            </button>
          )}
          {showLoyaltySetup && (
            <button className={'acct-item' + (loyaltySetupActive ? ' on' : '')} role="menuitem" onClick={() => { onLoyaltySetup(); setOpen(false); }}>
              <span className="ai-ic">🎟️</span>{t('nav_loyaltySetup')}
            </button>
          )}
          <button className="acct-item" role="menuitem" onClick={() => { setOpen(false); setPwOpen(true); }}>
            <span className="ai-ic">🔒</span>{t('changePassword')}
          </button>
          <button className="acct-item" role="menuitem" onClick={() => { setOpen(false); setEmailOpen(true); }}>
            <span className="ai-ic">@</span>{t('changeEmail')}
          </button>
          <div className="acct-sep" />
          {branches.length > 1 && (
            <div className="acct-row" role="group" aria-label={t('branch')}>
              <span>{t('branch')}</span>
              <select className="select" value={branchId ?? ''} onChange={(e) => onBranch(Number(e.target.value))}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
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

/* ============================ KDS BOARD ============================ */
type Modal = { type: 'accept' | 'decline' | 'cancel'; order: OrderResponse } | null;

/* Live "who's on the menu right now" per QR — initial fetch + 30s safety poll,
   with SSE pushing instant snapshots into the same query cache. Shared by the
   KDS board strip and the Tables tab. Rebuilds the stream when the JWT rotates —
   EventSource can't update its URL itself. */
function useQrActivity(branchId?: number) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['qr-activity', branchId],
    queryFn: () => api.get<QrActivity>(`/api/dashboard/qr-activity?branchId=${branchId}`),
    enabled: !!branchId,
    refetchInterval: 30_000,
  });
  const [token, setToken] = useState(accessTokenValue);
  useEffect(() => onAuthChange(() => setToken(accessTokenValue())), []);
  useEffect(() => {
    if (!branchId) return;
    const url = `/api/dashboard/qr-activity/stream?branchId=${branchId}${token ? `&access_token=${encodeURIComponent(token)}` : ''}`;
    const es = new EventSource(url);
    const onMsg = (e: MessageEvent) => {
      try { qc.setQueryData(['qr-activity', branchId], JSON.parse(e.data) as QrActivity); } catch { /* ignore */ }
    };
    es.addEventListener('qr-activity', onMsg as EventListener);
    return () => { es.removeEventListener('qr-activity', onMsg as EventListener); es.close(); };
  }, [branchId, qc, token]);
  return data;
}

function cartPreview(cart: QrCartItem[] | undefined, lang: string, limit = 3) {
  if (!cart?.length) return '';
  const shown = cart.slice(0, limit).map((i) =>
    `${i.quantity}× ${lang === 'ar' ? (i.nameAr || i.nameEn) : (i.nameEn || i.nameAr)}`);
  return `${shown.join(' · ')}${cart.length > limit ? ' ...' : ''}`;
}

function ActivitySummary({ ordering, t }: { ordering: number; t: (k: string) => string }) {
  return (
    <div className="qa-summary">
      <span className="qa-kicker"><span className="qa-d" />{t('qaLive')}</span>
      <span className="qa-bigmetric"><b>{ordering}</b>{t('qaOrdering')}</span>
    </div>
  );
}

/* Slim "get ready" strip above the KDS columns: only carts being built now.
   Pure browsing is intentionally hidden so the kitchen sees signals, not noise. */
function LiveActivityStrip({ activity, tokenToTable, t, lang }: {
  activity?: QrActivity; tokenToTable: Map<string, string>; t: (k: string) => string; lang: string;
}) {
  if (!activity || activity.totalOrdering <= 0) return null;
  const chips = Object.entries(activity.liveByKey)
    .map(([key, v]) => ({ key, ...v, cart: activity.cartsByKey?.[key] ?? [] }))
    .filter((v) => v.ordering > 0 || v.cart.length > 0)
    .sort((a, b) => (b.cart.length - a.cart.length) || (b.ordering - a.ordering));
  const placeOf = (key: string) => {
    if (key === 'car') return { code: 'CAR', label: t('car') };
    const table = tokenToTable.get(key) ?? '';
    return { code: table ? `T${table}` : 'TBL', label: `${t('table')} ${table}`.trim() };
  };
  return (
    <section className="qa-strip" aria-label={t('orderingNow')}>
      <ActivitySummary ordering={activity.totalOrdering} t={t} />
      <div className="qa-feed">
        {chips.map((c) => {
          const place = placeOf(c.key);
          const cart = cartPreview(c.cart, lang);
          return (
            <article className="qa-card active" key={c.key} title={t('qaCartHint')}>
              <div className="qa-card-top">
                <span className="qa-type">{place.code}</span>
                <b className="qa-place">{place.label}</b>
              </div>
              <div className="qa-cartline"><b>{cart || `${c.ordering} ${t('qaOrdering')}`}</b></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function KdsBoard({ branchId, focusSignal }: { branchId?: number; focusSignal: number }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();

  // keep the screen awake while the live board is open (counter phone / tablet)
  useWakeLock(true);

  const restaurantQ = useQuery({
    queryKey: ['restaurant', user!.restaurantId],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${user!.restaurantId}`),
    enabled: !!user!.restaurantId,
  });

  const { data: tablesRaw } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get<any>(`/api/branches/${branchId}/tables`),
    enabled: !!branchId,
  });
  const tableNo = useMemo(() => {
    const list: TableResponse[] = Array.isArray(tablesRaw) ? tablesRaw : tablesRaw?.content ?? [];
    return new Map(list.map((tb) => [tb.id, tb.tableNumber]));
  }, [tablesRaw]);
  // live activity is keyed by qrCodeToken, not table id
  const tokenToTable = useMemo(() => {
    const list: TableResponse[] = Array.isArray(tablesRaw) ? tablesRaw : tablesRaw?.content ?? [];
    return new Map(list.map((tb) => [tb.qrCodeToken, tb.tableNumber]));
  }, [tablesRaw]);
  const activity = useQrActivity(branchId);

  const liveKey = ['live', branchId ?? 'all'];
  const { data: orders = [] } = useQuery({
    queryKey: liveKey,
    queryFn: () => api.get<OrderResponse[]>(`/api/dashboard/orders/live${branchId ? `?branchId=${branchId}` : ''}`),
    refetchInterval: 15_000,
  });

  const [mobileCol, setMobileCol] = useState<OrderStatus>('PENDING');
  // The stream + alerts now live in the Shell (useLiveOrderAlerts) so they fire on every
  // tab; the board just renders the cache that stream keeps warm. Tapping the shell's
  // new-order banner bumps focusSignal — jump the mobile board back to the New column.
  useEffect(() => { if (focusSignal) setMobileCol('PENDING'); }, [focusSignal]);

  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(i); }, []);

  const [modal, setModal] = useState<Modal>(null);
  const [field, setField] = useState('');
  const [invoice, setInvoice] = useState<OrderResponse | null>(null);
  const [paymentPrompt, setPaymentPrompt] = useState<{ order: OrderResponse; completeAfter: boolean } | null>(null);

  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api.patch<OrderResponse>(path, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKey }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  const pay = useMutation({
    mutationFn: ({ orderId, method }: { orderId: number; method: 'CASH' | 'CARD' }) =>
      api.post(`/api/payments/orders/${orderId}/mark-paid`, { method }),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKey }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const finishOrder = (o: OrderResponse, collect: boolean) => {
    const complete = () => act.mutate({ path: `/api/dashboard/orders/${o.id}/complete` });
    if (collect) requestPayment(o, true);
    else complete();
  };
  const requestPayment = (order: OrderResponse, completeAfter: boolean) => {
    if (restaurantQ.data?.paymentMethodSelectionEnabled) {
      setPaymentPrompt({ order, completeAfter });
      return;
    }
    pay.mutate({ orderId: order.id, method: 'CARD' }, {
      onSuccess: () => {
        if (completeAfter) act.mutate({ path: `/api/dashboard/orders/${order.id}/complete` });
      },
    });
  };
  const recordPayment = (method: 'CASH' | 'CARD') => {
    if (!paymentPrompt) return;
    const { order, completeAfter } = paymentPrompt;
    pay.mutate({ orderId: order.id, method }, {
      onSuccess: () => {
        setPaymentPrompt(null);
        if (completeAfter) act.mutate({ path: `/api/dashboard/orders/${order.id}/complete` });
      },
    });
  };

  const openModal = (type: NonNullable<Modal>['type'], order: OrderResponse) => { setField(type === 'accept' ? '6' : ''); setModal({ type, order }); };
  const confirmModal = () => {
    if (!modal) return;
    const id = modal.order.id;
    if (modal.type === 'accept') act.mutate({ path: `/api/dashboard/orders/${id}/accept`, body: { prepTimeMinutes: Number(field) || null } });
    if (modal.type === 'decline') act.mutate({ path: `/api/dashboard/orders/${id}/decline`, body: { reason: field || null } });
    if (modal.type === 'cancel') act.mutate({ path: `/api/dashboard/orders/${id}/cancel`, body: { reason: field || null } });
    setModal(null);
  };

  const canAccept = canAcceptOrders(user);
  const canPay = can(user, 'PAYMENTS');

  return (
    <>
      <LiveActivityStrip activity={activity} tokenToTable={tokenToTable} t={t} lang={lang} />

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
                  <OrderCard key={o.id} o={o} tableNo={tableNo} t={t} lang={lang} canAccept={canAccept} canPay={canPay}
                    onAccept={() => openModal('accept', o)} onDecline={() => openModal('decline', o)} onCancel={() => openModal('cancel', o)}
                    onReady={() => act.mutate({ path: `/api/dashboard/orders/${o.id}/ready` })}
                    onComplete={() => finishOrder(o, false)} onCollect={() => finishOrder(o, true)}
                    onPay={() => requestPayment(o, false)} onPrint={() => setInvoice(o)} />
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

      {paymentPrompt && (
        <div className="modal-bg" onClick={(e) => {
          if (e.target === e.currentTarget && !pay.isPending) setPaymentPrompt(null);
        }}>
          <div className="modal-card payment-method-modal" role="dialog" aria-modal="true" aria-labelledby="payment-method-title">
            <h3 id="payment-method-title">{t('paymentTitle')}</h3>
            <div className="ph">{t('paymentSub')} · {paymentPrompt.order.orderNumber}</div>
            <Money value={paymentPrompt.order.total} className="payment-method-total num" />
            <div className="payment-method-grid">
              <button className="payment-method cash" disabled={pay.isPending} onClick={() => recordPayment('CASH')}>
                <span aria-hidden="true">💵</span><b>{t('paymentCash')}</b>
              </button>
              <button className="payment-method card" disabled={pay.isPending} onClick={() => recordPayment('CARD')}>
                <span aria-hidden="true">▣</span><b>{t('paymentCard')}</b>
              </button>
            </div>
            <button className="btn ghost payment-cancel" disabled={pay.isPending} onClick={() => setPaymentPrompt(null)}>{t('back')}</button>
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

function OrderCard({ o, tableNo, t, lang, canAccept, canPay, onAccept, onDecline, onCancel, onReady, onComplete, onCollect, onPay, onPrint }: any) {
  const el = fmtElapsed(o.createdAt);
  const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
  const where = o.orderType === 'DINE_IN'
    ? <span className="where">🪑 <span className="tg">{t('table')} {o.tableId ? (tableNo.get(o.tableId) ?? o.tableId) : ''}</span></span>
    : <span className="where">🚗 <span className="tg">{t('car')}{o.carPlate ? ` · ${o.carPlate}` : ''}</span><CarColorTag color={o.carColor} lang={lang} /></span>;
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
      {o.loyaltyRewardLabel && <div className="oreward"><b>🎁 {t('loyaltyReward')}</b> {o.loyaltyRewardLabel}{o.loyaltyRewardDiscount ? <> · <Money value={-o.loyaltyRewardDiscount} className="num" /></> : null}</div>}
      {o.customerNote && <div className="onote"><b>{t('note')}:</b> {o.customerNote}{o.customerName ? ` — ${o.customerName}` : ''}</div>}
      <div className="ocard-foot">
        <Money value={o.total} className="ototal num" />
        {o.paymentStatus === 'PAID' ? <span className="pay paid">✓ {t('paid')}</span>
          : canPay ? <span className="pay unpaid" onClick={onPay}>{t('unpaid')}</span>
          : <span className="pay unpaid static">{t('unpaid')}</span>}
      </div>
      {/* Kitchen-only staff (no ORDERS) advance tickets (Start preparing / Ready) but can't accept,
          cancel or complete — those stay gated to ORDERS so the buttons never 403. */}
      <div className="oactions">
        {o.status === 'PENDING' && canAccept && <><button className="btn sm" onClick={onAccept}>{t('accept')}</button><button className="btn sm ghost" onClick={onDecline}>{t('decline')}</button></>}
        {(o.status === 'ACCEPTED' || o.status === 'PREPARING') && <><button className="btn sm" onClick={onReady}>{t('ready')}</button>{canAccept && <button className="btn sm danger" onClick={onCancel}>{t('cancel')}</button>}</>}
        {o.status === 'READY' && canAccept && (
          o.paymentStatus !== 'PAID' && canPay
            ? <>
                <button className="btn collect-btn" onClick={onCollect}>✓ {t('collect')} <Money value={o.total} className="num" /> · {t('done')}</button>
                <button className="btn sm ghost" onClick={onComplete}>{t('doneUnpaid')}</button>
              </>
            : <button className="btn sm" onClick={onComplete}>✓ {t('done')}</button>
        )}
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

// On-screen QR ink + badge mirror the Serva theme tokens (theme.css): --ink and
// --accent/--lime. Hardcoded (not var()) because the print path renders this SVG
// into a popup window with no app stylesheet — print callers pass #000 explicitly.
const QR_INK = '#15181C';      // --ink
const QR_ACCENT = '#10b981';   // --accent / --lime
function BrandedQrCode({ value, size, fgColor = QR_INK, marginSize = 1, badge = true }:
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
        cells += roundRectPath(px(c), px(r), cell, cell, cell * 0.16);
      }
    }
    const eye = (gr: number, gc: number) => {
      const x = px(gc), y = px(gr), s = cell * 7;
      // square, bold finder frames — mirror the app's hard-edged boxes (not soft circles)
      return `${roundRectPath(x, y, s, s, cell * 0.45)}${roundRectPath(x + cell, y + cell, cell * 5, cell * 5, cell * 0.32)}${roundRectPath(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.24)}`;
    };
    const eyes = `${eye(0, 0)}${eye(0, n - 7)}${eye(n - 7, 0)}`;
    return { cells, eyes, cell };
  }, [value, size, marginSize, badge]);

  const bw = size * 0.3, bh = size * 0.135, bx = (size - bw) / 2, by = (size - bh) / 2;
  // Neobrutalist chip: hard offset shadow, tight corners, thick ink keyline.
  const badgeSh = Math.max(2, size * 0.016), badgeR = bh * 0.16, badgeBorder = Math.max(2, size * 0.013);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" shapeRendering="geometricPrecision">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={cells} fill={fgColor} />
      {/* finder eyes: ink frame, white gap, ink pupil (even-odd lets one path nest) */}
      <path d={eyes} fill={fgColor} fillRule="evenodd" />
      {badge && (
        <>
          {/* clear the QR behind the chip and its hard shadow */}
          <path d={roundRectPath(bx - cell, by - cell, bw + cell * 2 + badgeSh, bh + cell * 2 + badgeSh, cell * 0.4)} fill="#ffffff" />
          {/* signature offset block shadow */}
          <path d={roundRectPath(bx + badgeSh, by + badgeSh, bw, bh, badgeR)} fill={fgColor} />
          {/* lime brand chip + ink keyline \u2014 same recipe as the .mark chip */}
          <path d={roundRectPath(bx, by, bw, bh, badgeR)} fill={QR_ACCENT} stroke={fgColor} strokeWidth={badgeBorder} />
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
  const { lang } = useI18n();
  const toast = useToast();
  const confirm = useConfirm();
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

  // Live "ordering now" + today's orders per QR (shared hook: fetch + poll + SSE).
  const activity = useQrActivity(branchId);
  const todayOf = (key?: string) => (key ? activity?.todayByKey[key] : undefined);
  const ActivityRow = ({ liveKey, todayKey }: { liveKey: string; todayKey: string }) => {
    const day = todayOf(todayKey);
    // Peek into carts being built on this QR right now — a soft "get ready" signal.
    const live = activity?.liveByKey[liveKey];
    const cartPeek = live && live.ordering > 0 ? activity?.cartsByKey?.[liveKey] : undefined;
    const cartText = cartPreview(cartPeek, lang, 4);
    return (
      <div className="qa-row">
        <div className="qa-row-top">
          {live && live.ordering > 0 && !cartText && <span className="qa-live" title={t('qaNow')}><b>{live.ordering}</b> {t('qaOrdering')}</span>}
          <span className="qa-today">{t('qaToday')}: {day?.orders ?? 0} {t('qaOrders')} · <Money value={day?.revenue ?? 0} className="num" /></span>
        </div>
        {cartText && <div className="qa-cart" title={t('qaCartHint')}><b>{cartText}</b></div>}
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
                    <button className="btn sm ghost" onClick={async () => { if (await confirm({ danger: true, title: t('regenerate'), message: t('regenWarn'), confirmLabel: t('regenerate'), cancelLabel: t('cancel') })) regen.mutate(tb.id); }}>↻ {t('regenerate')}</button>
                    <button className="btn sm danger" onClick={async () => { if (await confirm({ danger: true, title: t('delWarn'), confirmLabel: t('del'), cancelLabel: t('cancel') })) del.mutate(tb.id); }}>{t('del')}</button>
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
