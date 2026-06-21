import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useSpring, useTransform, useReducedMotion, type Variants } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { omr, omanDate } from '../../lib/format';
import type { Restaurant, BranchResponse } from '../../lib/types';
import './analytics.css';

/* ---- API shapes ---- */
interface BestItem { menuItemId: number; nameEn: string; nameAr: string; totalQuantity: number; totalRevenue: string }
interface HourlyCount { hour: number; orders: number }
interface Summary {
  from: string; to: string;
  totalOrders: number; pendingOrders: number; acceptedOrders: number; declinedOrders: number;
  preparingOrders: number; readyOrders: number; completedOrders: number; cancelledOrders: number;
  totalRevenue: string; averageOrderValue: string;
  bestSellingItems: BestItem[]; busiestHours: HourlyCount[];
}
interface DailyPoint { date: string; orders: number; revenue: string }
interface Conversion { menuItemId: number; nameEn: string; nameAr: string; views: number; orders: number; conversionRate: string }
interface Affinity { itemAId: number; aNameEn: string; aNameAr: string; itemBId: number; bNameEn: string; bNameAr: string; coOrders: number }
interface Staff { actorUserId: number; actorName: string; accepted: number; declined: number; completed: number; avgAcceptSeconds: number | null }
interface ForecastSlot { dayOfWeek: number; hour: number; expectedOrders: number }
interface CustomerInsight { profileId: number; name: string; phone: string; orderCount: number; lastOrderAt: string | null }
interface Customers { topRegulars: CustomerInsight[]; atRisk: CustomerInsight[] }
interface CustomerBase {
  totalCustomers: number; repeatCustomers: number; repeatRatePercent: number;
  avgOrdersPerCustomer: number; newCustomers: number; activeCustomers: number; repeatOrderSharePercent: number;
}
interface Benchmark {
  yourAov: string; medianAov: string; aovPercentile: number;
  yourAcceptSeconds: number | null; medianAcceptSeconds: number | null; acceptPercentile: number;
  comparableCafes: number;
}
interface Funnel { menuViews: number; addedToCart: number; checkoutStarted: number; ordersPlaced: number }
interface DaypartPoint { daypart: string; orders: number; revenue: string }
interface KitchenTiming {
  acceptSeconds: number | null; prepSeconds: number | null; handoffSeconds: number | null;
  toReadySeconds: number | null; toCompleteSeconds: number | null; sampleOrders: number;
}

type Range = 'today' | '7d' | '30d' | '90d' | 'custom';
type Section = 'overview' | 'menu' | 'team' | 'customers';
type T = (k: string) => string;

const DICT: Dict = {
  ar: {
    a_today: 'اليوم', a_7d: '٧ أيام', a_30d: '٣٠ يوم', a_90d: '٩٠ يوم', a_custom: 'مخصّص', a_pro: 'برو',
    a_orders: 'طلبات', a_revenue: 'الإيرادات', a_aov: 'متوسط الطلب',
    a_avgShort: 'المتوسط', a_doneShort: 'مكتمل',
    a_vsLast: 'مقابل {d} الماضي', a_vsPrevN: 'مقابل {n} يوماً سابقة', a_new: 'جديد',
    a_busiest: 'أكثر الساعات ازدحامًا', a_bestsellers: 'الأكثر مبيعًا',
    a_status: 'حالة الطلبات', a_pending: 'معلّقة', a_accepted: 'مقبولة', a_preparing: 'تُحضَّر', a_inprogress: 'قيد التنفيذ',
    a_ready: 'جاهزة', a_completed: 'مكتملة', a_cancelled: 'ملغاة', a_declined: 'مرفوضة',
    a_noOrders: 'لا توجد طلبات بعد — ستظهر هنا فور وصولها.',
    a_noData: 'لا توجد بيانات لهذه الفترة.', a_retry: 'حاول مرة أخرى',
    a_secOverview: 'نظرة عامة', a_secMenu: 'القائمة', a_secTeam: 'الفريق', a_secCustomers: 'العملاء',
    a_lockTitle: 'افتح تحليلات برو', a_lockCta: 'الترقية إلى برو',
    a_lockMenu: 'اعرف أي الأصناف تُشاهَد كثيرًا وتُطلب قليلًا، وما الذي يُطلب معًا.',
    a_lockTeam: 'تابِع سرعة القبول وإنتاجية كل عضو في الفريق.',
    a_lockCustomers: 'اكتشف عملاءك الدائمين واستعِد من بدأوا يبتعدون.',
    a_conv: 'تحويل الأصناف', a_convSub: 'مشاهدة ← طلب', a_views: 'مشاهدة', a_low: 'ضعيف',
    a_funnel: 'مسار التحويل', a_fn_sub: 'من المشاهدة إلى الطلب',
    a_fn_views: 'مشاهدات القائمة', a_fn_cart: 'أُضيف للسلة', a_fn_checkout: 'بدء الدفع', a_fn_orders: 'تم الطلب',
    a_basket: 'يُطلبان معًا', a_together: '×',
    a_basketHint: 'تظهر الأزواج التي تكررت في طلبين مختلفين على الأقل.',
    a_staff: 'أداء الفريق', a_avgAccept: 'متوسط القبول',
    a_forecast: 'إيقاع الأسبوع', a_expected: 'متوقّع', a_rhythmHint: 'متوسط الطلبات لكل ساعة · آخر ٤ أسابيع',
    a_customers: 'العملاء', a_regulars: 'الأكثر ولاءً', a_atrisk: 'بدأوا يبتعدون', a_ordersN: 'طلبات', a_daysN: 'يوم', a_never: '—',
    a_cbase: 'قاعدة العملاء', a_cb_repeat: 'نسبة العائدين', a_cb_repeatSub: '{r} من {n} عميلًا يعيدون الطلب',
    a_cb_avg: 'متوسط الطلبات/عميل', a_cb_new: 'جدد هذا الشهر', a_cb_active: 'نشطون (٣٠ يومًا)', a_cb_repeatShare: 'حصة الطلبات المتكررة',
    a_cb_newOrders: 'أوائل', a_cb_returningOrders: 'متكررة',
    a_benchmark: 'مقارنة مرجعية', a_you: 'مطعمك', a_median: 'الوسيط', a_percentile: 'المئين', a_vsCafes: 'مقابل {n} مطعمًا',
    a_daypart: 'حسب وقت اليوم',
    a_dp_morning: 'الصباح', a_dp_midday: 'الظهيرة', a_dp_afternoon: 'العصر', a_dp_evening: 'المساء', a_dp_late: 'وقت متأخر',
    a_kitchen: 'توقيت المطبخ', a_kt_accept: 'حتى القبول', a_kt_prep: 'التحضير', a_kt_handoff: 'التسليم',
    a_kt_toReady: 'حتى الجاهزية', a_kt_total: 'الإجمالي', a_kt_bottleneck: 'أبطأ خطوة', a_kt_sample: 'عبر {n} طلبًا', a_min: 'د',
    a_sec: 'ث', a_trend: 'الاتجاه', a_trendSub: 'آخر ٧ أيام',
    a_metricRev: 'الإيرادات', a_metricOrd: 'الطلبات', a_less: 'أقل', a_more: 'أكثر',
    a_allBranches: 'كل الفروع',
    a_insBusiest: '{h} هي أكثر ساعاتك ازدحامًا', a_insTop: '{name} يمثل {p}٪ من الإيرادات',
    a_insWeak: '{name} يحصل على مشاهدات بطلبات قليلة', a_insRisk: '{n} من عملائك الدائمين بدأوا يبتعدون',
    a_insBench: 'متوسط طلبك يتفوق على {p}٪ من المطاعم',
  },
  en: {
    a_today: 'Today', a_7d: '7 days', a_30d: '30 days', a_90d: '90 days', a_custom: 'Custom', a_pro: 'Pro',
    a_orders: 'orders', a_revenue: 'Revenue', a_aov: 'Avg order',
    a_avgShort: 'avg', a_doneShort: 'done',
    a_vsLast: 'vs last {d}', a_vsPrevN: 'vs previous {n} days', a_new: 'new',
    a_busiest: 'Busiest hours', a_bestsellers: 'Best sellers',
    a_status: 'Order status', a_pending: 'Pending', a_accepted: 'Accepted', a_preparing: 'Preparing', a_inprogress: 'In progress',
    a_ready: 'Ready', a_completed: 'Completed', a_cancelled: 'Cancelled', a_declined: 'Declined',
    a_noOrders: "No orders yet — they'll appear here as they come in.",
    a_noData: 'No data for this period.', a_retry: 'Try again',
    a_secOverview: 'Overview', a_secMenu: 'Menu', a_secTeam: 'Team', a_secCustomers: 'Customers',
    a_lockTitle: 'Unlock Pro analytics', a_lockCta: 'Upgrade to Pro',
    a_lockMenu: 'See which items get views but few orders, and what sells together.',
    a_lockTeam: 'Track accept times and throughput for each team member.',
    a_lockCustomers: 'Spot your regulars and win back customers going quiet.',
    a_conv: 'Item conversion', a_convSub: 'view → order', a_views: 'views', a_low: 'low',
    a_funnel: 'Conversion funnel', a_fn_sub: 'menu view → order',
    a_fn_views: 'Menu views', a_fn_cart: 'Added to cart', a_fn_checkout: 'Checkout started', a_fn_orders: 'Order placed',
    a_basket: 'Ordered together', a_together: '×',
    a_basketHint: 'Pairs that repeated across at least 2 orders show up here.',
    a_staff: 'Staff performance', a_avgAccept: 'Avg accept',
    a_forecast: 'Weekly rhythm', a_expected: 'expected', a_rhythmHint: 'avg orders per hour · last 4 weeks',
    a_customers: 'Customers', a_regulars: 'Top regulars', a_atrisk: 'Going quiet', a_ordersN: 'orders', a_daysN: 'days', a_never: '—',
    a_cbase: 'Customer base', a_cb_repeat: 'Repeat rate', a_cb_repeatSub: '{r} of {n} customers reorder',
    a_cb_avg: 'Avg orders/customer', a_cb_new: 'New this month', a_cb_active: 'Active (30d)', a_cb_repeatShare: 'Repeat-order share',
    a_cb_newOrders: 'First-time', a_cb_returningOrders: 'Repeat',
    a_benchmark: 'Benchmark', a_you: 'You', a_median: 'Median', a_percentile: 'percentile', a_vsCafes: 'vs {n} cafés',
    a_daypart: 'By time of day',
    a_dp_morning: 'Morning', a_dp_midday: 'Midday', a_dp_afternoon: 'Afternoon', a_dp_evening: 'Evening', a_dp_late: 'Late night',
    a_kitchen: 'Kitchen timing', a_kt_accept: 'To accept', a_kt_prep: 'Prep', a_kt_handoff: 'Handoff',
    a_kt_toReady: 'To ready', a_kt_total: 'Total', a_kt_bottleneck: 'Slowest step', a_kt_sample: 'across {n} orders', a_min: 'm',
    a_sec: 's', a_trend: 'Trend', a_trendSub: 'last 7 days',
    a_metricRev: 'Revenue', a_metricOrd: 'Orders', a_less: 'less', a_more: 'more',
    a_allBranches: 'All branches',
    a_insBusiest: '{h} is your busiest hour', a_insTop: '{name} is {p}% of revenue',
    a_insWeak: '{name} gets views but few orders', a_insRisk: '{n} regulars have gone quiet',
    a_insBench: 'Your avg order beats {p}% of cafés',
  },
};

const INK = '#15181C';
const LIME = '#10b981';
const MUTED = '#566058';
const DAY = 86_400_000;

const hourLabel = (h: number) => { const am = h < 12; const v = h % 12 === 0 ? 12 : h % 12; return `${v}${am ? 'am' : 'pm'}`; };
const WEEK_AR = ['', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const WEEK_EN = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dowIndex = (iso: string) => { const d = new Date(iso + 'T00:00:00').getDay(); return d === 0 ? 7 : d; };
const fmtDate = (iso: string, lang: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', opts).format(new Date(iso + 'T00:00:00'));

/* staggered reveal for the insight strip + weekly rhythm */
const listV: Variants = { show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const itemV: Variants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

/* up/down/flat/new delta vs a comparable previous period */
interface Delta { dir: 'up' | 'down' | 'flat' | 'new' | 'none'; pct: number; abs: number }
function delta(now: number, prev: number | null | undefined): Delta {
  if (prev == null) return { dir: 'none', pct: 0, abs: 0 };
  const abs = now - prev;
  if (prev === 0) return { dir: now > 0 ? 'new' : 'flat', pct: 0, abs };
  const change = (abs / prev) * 100;
  if (Math.abs(change) < 0.5) return { dir: 'flat', pct: 0, abs };
  return { dir: change > 0 ? 'up' : 'down', pct: Math.abs(Math.round(change)), abs };
}

export default function AnalyticsPage({ branches }: { branches: BranchResponse[] }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT(DICT);
  const reduce = useReducedMotion();
  const [range, setRange] = useState<Range>('today');
  const [section, setSection] = useState<Section>('overview');
  const todayD = omanDate();
  const [customFrom, setCustomFrom] = useState(omanDate(new Date(Date.now() - 29 * DAY)));
  const [customTo, setCustomTo] = useState(todayD);

  const canPickBranch = branches.length > 0 && user!.branchId == null;
  const [branchFilter, setBranchFilter] = useState<number | 'all'>('all');
  const branchQs = canPickBranch && branchFilter !== 'all' ? `&branchId=${branchFilter}` : '';

  const nm = (en: string, ar: string) => (lang === 'ar' ? ar || en : en || ar);
  const cur = lang === 'ar' ? 'ر.ع' : 'OMR';

  // Active window (Oman-local YYYY-MM-DD) for the chosen range.
  const PRESET_DAYS: Record<Exclude<Range, 'custom'>, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };
  const win = range === 'custom'
    ? { from: customFrom || todayD, to: customTo || todayD }
    : { from: omanDate(new Date(Date.now() - (PRESET_DAYS[range] - 1) * DAY)), to: todayD };
  const from = win.from, to = win.to;
  const rangeQs = `from=${from}&to=${to}`;
  const isMulti = range !== 'today';
  const spanDays = Math.max(1, Math.round((new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / DAY) + 1);

  // Comparable previous period — same weekday last week (today) or the immediately-preceding window.
  const ymd = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const prev = range === 'today'
    ? { from: omanDate(new Date(Date.now() - 7 * DAY)), to: omanDate(new Date(Date.now() - 7 * DAY)) }
    : (() => { const fromMs = new Date(from + 'T00:00:00').getTime(); return { from: ymd(fromMs - spanDays * DAY), to: ymd(fromMs - DAY) }; })();

  const restaurantQ = useQuery({
    queryKey: ['restaurant', user!.restaurantId],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${user!.restaurantId}`),
    enabled: !!user!.restaurantId,
  });
  const isPro = restaurantQ.data?.plan === 'PRO' || restaurantQ.data?.plan === 'ENTERPRISE';

  const summaryQ = useQuery({
    queryKey: ['analytics-summary', from, to, branchFilter],
    queryFn: () => range === 'today'
      ? api.get<Summary>(`/api/dashboard/analytics/today${branchQs ? `?${branchQs.slice(1)}` : ''}`)
      : api.get<Summary>(`/api/dashboard/analytics/orders?${rangeQs}${branchQs}`),
  });

  const prevQ = useQuery({
    queryKey: ['analytics-prev', from, to, branchFilter],
    queryFn: () => api.get<Summary>(`/api/dashboard/analytics/orders?from=${prev.from}&to=${prev.to}${branchQs}`),
  });

  const dailyQ = useQuery({
    queryKey: ['an-daily', from, to, branchFilter],
    enabled: isMulti,
    queryFn: () => api.get<DailyPoint[]>(`/api/dashboard/analytics/daily?${rangeQs}${branchQs}`),
  });

  const daypartQ = useQuery({
    queryKey: ['an-daypart', from, to, branchFilter],
    queryFn: () => api.get<DaypartPoint[]>(`/api/dashboard/analytics/daypart?${rangeQs}${branchQs}`),
  });

  const kitchenQ = useQuery({
    queryKey: ['an-kitchen', from, to, branchFilter],
    enabled: isPro,
    queryFn: () => api.get<KitchenTiming>(`/api/dashboard/analytics/pro/kitchen-timing?${rangeQs}${branchQs}`),
  });

  const convQ = useQuery({ queryKey: ['an-conv', from, to, branchFilter], enabled: isPro, queryFn: () => api.get<Conversion[]>(`/api/dashboard/analytics/pro/item-conversion?${rangeQs}${branchQs}`) });
  const funnelQ = useQuery({ queryKey: ['an-funnel', from, to, branchFilter], enabled: isPro, queryFn: () => api.get<Funnel>(`/api/dashboard/analytics/pro/funnel?${rangeQs}${branchQs}`) });
  const basketQ = useQuery({ queryKey: ['an-basket', from, to, branchFilter], enabled: isPro, queryFn: () => api.get<Affinity[]>(`/api/dashboard/analytics/pro/market-basket?${rangeQs}${branchQs}&limit=6`) });
  const staffQ = useQuery({ queryKey: ['an-staff', from, to, branchFilter], enabled: isPro, queryFn: () => api.get<Staff[]>(`/api/dashboard/analytics/pro/staff?${rangeQs}${branchQs}`) });
  const forecastQ = useQuery({ queryKey: ['an-forecast', branchFilter], enabled: isPro, queryFn: () => api.get<ForecastSlot[]>(`/api/dashboard/analytics/pro/forecast?weeks=4${branchQs}`) });
  const customersQ = useQuery({ queryKey: ['an-customers', branchFilter], enabled: isPro, queryFn: () => api.get<Customers>(`/api/dashboard/analytics/pro/customers${branchQs ? `?${branchQs.slice(1)}` : ''}`) });
  const customerBaseQ = useQuery({ queryKey: ['an-customer-base', branchFilter], enabled: isPro, queryFn: () => api.get<CustomerBase>(`/api/dashboard/analytics/pro/customer-base${branchQs ? `?${branchQs.slice(1)}` : ''}`) });
  // Benchmark temporarily disabled — see commented card below. Re-enable when reworked.
  // const benchmarkQ = useQuery({ queryKey: ['an-benchmark'], enabled: isPro, queryFn: () => api.get<Benchmark>('/api/dashboard/analytics/pro/benchmark') });

  const s = summaryQ.data;

  // Plain-language insights, prioritised & capped at 3 — same voice as the weekly email.
  const insights = useMemo(() => {
    if (!s) return [] as Array<{ icon: string; text: string }>;
    const out: Array<{ icon: string; text: string }> = [];
    if (range === 'today' && s.busiestHours.length) {
      const peak = [...s.busiestHours].sort((a, b) => b.orders - a.orders)[0];
      out.push({ icon: '☕', text: t('a_insBusiest').replace('{h}', hourLabel(peak.hour)) });
    }
    const top = s.bestSellingItems[0];
    const totalRev = Number(s.totalRevenue);
    if (top && totalRev > 0) {
      const share = Math.round((Number(top.totalRevenue) / totalRev) * 100);
      if (share > 0) out.push({ icon: '⭐', text: t('a_insTop').replace('{name}', nm(top.nameEn, top.nameAr)).replace('{p}', String(share)) });
    }
    if (isPro) {
      const weak = (convQ.data ?? []).filter((c) => c.views >= 5).sort((a, b) => Number(a.conversionRate) - Number(b.conversionRate))[0];
      if (weak) out.push({ icon: '💡', text: t('a_insWeak').replace('{name}', nm(weak.nameEn, weak.nameAr)) });
      const risk = customersQ.data?.atRisk.length ?? 0;
      if (risk > 0) out.push({ icon: '👋', text: t('a_insRisk').replace('{n}', String(risk)) });
      // Benchmark insight temporarily disabled.
      // const b = benchmarkQ.data;
      // if (b && b.comparableCafes >= 5) out.push({ icon: '📈', text: t('a_insBench').replace('{p}', String(Math.max(0, Math.min(100, b.aovPercentile)))) });
    }
    return out.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, range, isPro, convQ.data, customersQ.data, lang]);

  const sparkBars = useMemo(() => {
    if (!s) return [];
    if (range === 'today') {
      return [...s.busiestHours].sort((a, b) => a.hour - b.hour)
        .map((h) => ({ label: hourLabel(h.hour), value: h.orders, hint: `${hourLabel(h.hour)} · ${h.orders}` }));
    }
    return (dailyQ.data ?? []).map((d) => ({
      label: (lang === 'ar' ? WEEK_AR : WEEK_EN)[dowIndex(d.date)],
      value: Number(d.revenue),
      hint: `${fmtDate(d.date, lang, { day: 'numeric', month: 'short' })} · ${omr(d.revenue)}`,
    }));
  }, [s, range, dailyQ.data, lang]);

  const rangeLabel = range === 'today' ? t('a_today') : range === '7d' ? t('a_7d') : range === '30d' ? t('a_30d') : range === '90d' ? t('a_90d') : t('a_custom');
  const eyebrow = range === 'today'
    ? `${t('a_today')} · ${fmtDate(to, lang, { weekday: 'short', day: 'numeric', month: 'short' })}`
    : `${rangeLabel} · ${fmtDate(from, lang, { day: 'numeric', month: 'short' })} – ${fmtDate(to, lang, { day: 'numeric', month: 'short' })}`;
  const vsLabel = range === 'today'
    ? t('a_vsLast').replace('{d}', fmtDate(prev.to, lang, { weekday: 'short' }))
    : t('a_vsPrevN').replace('{n}', String(spanDays));
  const presets: Range[] = isPro ? ['today', '7d', '30d', '90d', 'custom'] : ['today', '7d'];

  const tabs: Array<{ key: Section; label: string; locked: boolean }> = [
    { key: 'overview', label: t('a_secOverview'), locked: false },
    { key: 'menu', label: t('a_secMenu'), locked: false },
    { key: 'team', label: t('a_secTeam'), locked: !isPro },
    { key: 'customers', label: t('a_secCustomers'), locked: !isPro },
  ];

  return (
    <div className="an">
      <div className="an-rangebar">
        <div className="an-seg" role="tablist" aria-label={rangeLabel}>
          {presets.map((p) => (
            <button key={p} role="tab" aria-selected={range === p} className={range === p ? 'on' : ''}
              onClick={() => setRange(p)}>{p === 'today' ? t('a_today') : p === '7d' ? t('a_7d') : p === '30d' ? t('a_30d') : p === '90d' ? t('a_90d') : t('a_custom')}</button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="an-daterange">
            <input type="date" value={customFrom} max={customTo || todayD} onChange={(e) => setCustomFrom(e.target.value)} aria-label={t('a_custom')} />
            <span className="an-dr-sep">–</span>
            <input type="date" value={customTo} min={customFrom} max={todayD} onChange={(e) => setCustomTo(e.target.value)} aria-label={t('a_custom')} />
          </div>
        )}
        {canPickBranch && (
          <select className="an-branch-sel" value={branchFilter} aria-label={t('a_allBranches')} onChange={(e) => setBranchFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">{t('a_allBranches')}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <div className="an-tabs" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.key} role="tab" aria-selected={section === tab.key}
            className={section === tab.key ? 'on' : ''} onClick={() => setSection(tab.key)}>
            {tab.label}{tab.locked && <span className="an-tab-lock" aria-hidden> 🔒</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div className="an-pane" key={section + range + branchFilter} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>

          {/* ---------- OVERVIEW ---------- */}
          {section === 'overview' && (
            summaryQ.isLoading ? <Skeleton /> :
            summaryQ.isError ? <ErrCard message={summaryQ.error instanceof ApiError ? summaryQ.error.message : t('a_noData')} onRetry={() => summaryQ.refetch()} t={t} /> :
            s ? (
              <>
                <Hero
                  s={s} cur={cur} t={t} eyebrow={eyebrow}
                  revDelta={delta(Number(s.totalRevenue), prevQ.data ? Number(prevQ.data.totalRevenue) : null)}
                  ordDelta={delta(s.totalOrders, prevQ.data ? prevQ.data.totalOrders : null)}
                  aovDelta={delta(Number(s.averageOrderValue), prevQ.data ? Number(prevQ.data.averageOrderValue) : null)}
                  vsLabel={vsLabel}
                  spark={sparkBars}
                />

                {insights.length > 0 && (
                  <motion.ul className="an-insights" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                    {insights.map((it, i) => (
                      <motion.li key={i} className="an-insight" variants={itemV}><span className="an-insight-ic" aria-hidden>{it.icon}</span>{it.text}</motion.li>
                    ))}
                  </motion.ul>
                )}

                {isMulti && dailyQ.data && <TrendCard data={dailyQ.data} lang={lang} cur={cur} t={t} days={spanDays} />}

                <div className="an-grid">
                  <section className="an-card">
                    <h3>{t('a_status')}</h3>
                    <StatusBreakdown s={s} t={t} />
                  </section>
                  {daypartQ.data && (
                    <section className="an-card">
                      <h3>{t('a_daypart')}</h3>
                      <DaypartCard rows={daypartQ.data} t={t} />
                    </section>
                  )}
                  {/* Benchmark card temporarily disabled — needs rework (small-sample UX,
                      per-café volume floor, like-for-like cohort). Re-enable benchmarkQ above to restore.
                  {isPro && benchmarkQ.data && (
                    <section className="an-card">
                      <h3>{t('a_benchmark')}</h3>
                      <div className="an-bench">
                        <BenchRow label={t('a_aov')} you={omr(benchmarkQ.data.yourAov)} median={omr(benchmarkQ.data.medianAov)} pct={benchmarkQ.data.aovPercentile} t={t} />
                        <BenchRow
                          label={t('a_avgAccept')}
                          you={benchmarkQ.data.yourAcceptSeconds == null ? t('a_never') : `${Math.round(benchmarkQ.data.yourAcceptSeconds)}${t('a_sec')}`}
                          median={benchmarkQ.data.medianAcceptSeconds == null ? t('a_never') : `${Math.round(benchmarkQ.data.medianAcceptSeconds)}${t('a_sec')}`}
                          pct={benchmarkQ.data.acceptPercentile}
                          t={t}
                        />
                        <p className="an-bench-foot">{t('a_vsCafes').replace('{n}', String(benchmarkQ.data.comparableCafes))}</p>
                      </div>
                    </section>
                  )}
                  */}
                </div>

                {isPro && forecastQ.data?.length ? (
                  <section className="an-card">
                    <h3>{t('a_forecast')}</h3>
                    <WeeklyRhythm slots={forecastQ.data} lang={lang} t={t} />
                  </section>
                ) : null}
              </>
            ) : null
          )}

          {/* ---------- MENU ---------- */}
          {section === 'menu' && (
            summaryQ.isLoading ? <Skeleton /> : (
              <>
                {isPro && funnelQ.data && <FunnelCard data={funnelQ.data} t={t} />}
                <div className="an-grid">
                  <section className="an-card">
                    <h3>{t('a_bestsellers')}</h3>
                    {!s || s.bestSellingItems.length === 0 ? <p className="an-empty">{t('a_noOrders')}</p> : (
                      <motion.ol className="an-list ranked" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                        {(() => {
                          const maxRev = Math.max(...s.bestSellingItems.map((it) => Number(it.totalRevenue)), 1);
                          return s.bestSellingItems.slice(0, 8).map((it, i) => (
                            <motion.li key={it.menuItemId} className="an-rankrow" variants={itemV}>
                              <span className="an-li-rank">{i + 1}</span>
                              <div className="an-rankrow-main">
                                <div className="an-rankrow-top">
                                  <span className="an-li-name">{nm(it.nameEn, it.nameAr)}</span>
                                  <span className="an-li-val">{it.totalQuantity} · {omr(it.totalRevenue)}</span>
                                </div>
                                <div className="an-bar"><motion.div className="an-bar-fill" style={{ width: `${(Number(it.totalRevenue) / maxRev) * 100}%` }}
                                  initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduce ? 0 : 0.12 + i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} /></div>
                              </div>
                            </motion.li>
                          ));
                        })()}
                      </motion.ol>
                    )}
                  </section>

                  {isPro && (
                    <section className="an-card">
                      <h3>{t('a_conv')} <small>{t('a_convSub')}</small></h3>
                      {!convQ.data?.length ? <p className="an-empty">{t('a_noData')}</p> : (
                        <ConversionBars rows={convQ.data.slice(0, 6)} nm={nm} t={t} />
                      )}
                    </section>
                  )}

                  {isPro && (
                    <section className="an-card">
                      <h3>{t('a_basket')}</h3>
                      {!basketQ.data?.length ? (
                        <p className="an-empty hint">{t('a_basketHint')}</p>
                      ) : (
                        <motion.ul className="an-pairs" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                          {basketQ.data.map((p) => (
                            <motion.li key={`${p.itemAId}-${p.itemBId}`} className="an-pair" variants={itemV}>
                              <span className="an-pair-names">{nm(p.aNameEn, p.aNameAr)} <i>+</i> {nm(p.bNameEn, p.bNameAr)}</span>
                              <span className="an-pair-n">{p.coOrders}{t('a_together')}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </section>
                  )}
                </div>

                {!isPro && <ProUpsell desc={t('a_lockMenu')} tags={[t('a_conv'), t('a_basket')]} t={t} />}
              </>
            )
          )}

          {/* ---------- TEAM ---------- */}
          {section === 'team' && (
            !isPro ? <ProUpsell desc={t('a_lockTeam')} tags={[t('a_staff')]} t={t} /> :
            staffQ.isLoading ? <Skeleton cards={1} /> : (
              <div className="an-grid">
                <section className="an-card">
                  <h3>{t('a_staff')}</h3>
                  {!staffQ.data?.length ? <p className="an-empty">{t('a_noData')}</p> : (
                    <motion.ol className="an-list ranked" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                      {[...staffQ.data].sort((a, b) => b.completed - a.completed).map((m, i) => (
                        <motion.li key={m.actorUserId} className="an-staffrow" variants={itemV}>
                          <span className={'an-li-rank' + (i === 0 ? ' top' : ' ghost')}>{i + 1}</span>
                          <span className="an-li-name">{m.actorName}</span>
                          <span className="an-staff-meta">
                            <b>{m.completed}</b>
                            <small>{m.avgAcceptSeconds == null ? t('a_never') : `${Math.round(m.avgAcceptSeconds)}${t('a_sec')}`}</small>
                          </span>
                        </motion.li>
                      ))}
                    </motion.ol>
                  )}
                </section>
                {kitchenQ.data && (
                  <section className="an-card">
                    <h3>{t('a_kitchen')}</h3>
                    <KitchenCard d={kitchenQ.data} t={t} />
                  </section>
                )}
              </div>
            )
          )}

          {/* ---------- CUSTOMERS ---------- */}
          {section === 'customers' && (
            !isPro ? <ProUpsell desc={t('a_lockCustomers')} tags={[t('a_regulars'), t('a_atrisk')]} t={t} /> :
            customersQ.isLoading ? <Skeleton cards={2} /> : (
              <>
                {customerBaseQ.data && customerBaseQ.data.totalCustomers > 0 && (
                  <section className="an-card">
                    <h3>{t('a_cbase')}</h3>
                    <CustomerBaseCard d={customerBaseQ.data} t={t} />
                  </section>
                )}
                <div className="an-grid">
                <section className="an-card">
                  <h3>{t('a_regulars')}</h3>
                  {!customersQ.data?.topRegulars.length ? <p className="an-empty">{t('a_noData')}</p> : (
                    <motion.ul className="an-people" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                      {customersQ.data.topRegulars.slice(0, 8).map((c) => (
                        <motion.li key={c.profileId} variants={itemV}><span className="an-av">{(c.name || c.phone).slice(0, 1)}</span><span className="an-li-name">{c.name || c.phone}</span><span className="an-li-val">{c.orderCount} {t('a_ordersN')}</span></motion.li>
                      ))}
                    </motion.ul>
                  )}
                </section>
                <section className="an-card">
                  <h3>{t('a_atrisk')}</h3>
                  {!customersQ.data?.atRisk.length ? <p className="an-empty">{t('a_noData')}</p> : (
                    <motion.ul className="an-people" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
                      {customersQ.data.atRisk.slice(0, 8).map((c) => (
                        <motion.li key={c.profileId} variants={itemV}><span className="an-av quiet">{(c.name || c.phone).slice(0, 1)}</span><span className="an-li-name">{c.name || c.phone}</span><span className="an-li-val">{c.lastOrderAt ? fmtDate(c.lastOrderAt.slice(0, 10), lang, { day: 'numeric', month: 'short' }) : t('a_never')}</span></motion.li>
                      ))}
                    </motion.ul>
                  )}
                </section>
              </div>
              </>
            )
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ===================================================================== */
/* Hero — the daybook headline                                            */
/* ===================================================================== */
function Hero({ s, cur, t, eyebrow, revDelta, ordDelta, aovDelta, vsLabel, spark }: {
  s: Summary; cur: string; t: T; eyebrow: string;
  revDelta: Delta; ordDelta: Delta; aovDelta: Delta; vsLabel: string; spark: Array<{ label: string; value: number; hint: string }>;
}) {
  const empty = s.totalOrders === 0;

  return (
    <section className="an-hero">
      <div className="an-hero-left">
        <span className="an-hero-eyebrow">{eyebrow}</span>
        <div className="an-hero-main">
          <span className="an-hero-cur">{cur}</span>
          <span className="an-hero-rev"><CountUp value={Number(s.totalRevenue)} decimals={3} /></span>
          <DeltaPill d={revDelta} t={t} />
        </div>
        <div className="an-hero-sub">
          <span><b><CountUp value={s.totalOrders} /></b> {t('a_orders')}{ordDelta.dir !== 'none' && ordDelta.abs !== 0 && <i className={'an-sub-delta ' + (ordDelta.abs > 0 ? 'up' : 'down')}>{ordDelta.abs > 0 ? '▲' : '▼'}{Math.abs(ordDelta.abs)}</i>}</span>
          <span className="dot">·</span>
          <span>{t('a_avgShort')} <b className="num">{omr(s.averageOrderValue)}</b>{(aovDelta.dir === 'up' || aovDelta.dir === 'down') && <i className={'an-sub-delta ' + aovDelta.dir}>{aovDelta.dir === 'up' ? '▲' : '▼'}{aovDelta.pct}%</i>}</span>
          <span className="dot">·</span>
          <span><b className="num">{s.completedOrders}</b> {t('a_doneShort')}</span>
          {revDelta.dir !== 'none' && <span className="an-hero-vs">{vsLabel}</span>}
        </div>
      </div>
      <div className="an-hero-spark">
        {empty || spark.length === 0 ? <p className="an-empty">{t('a_noOrders')}</p> : <Spark bars={spark} />}
      </div>
    </section>
  );
}

function DeltaPill({ d, t }: { d: Delta; t: T }) {
  if (d.dir === 'none') return null;
  if (d.dir === 'new') return <span className="an-delta" data-dir="up">{t('a_new')}</span>;
  if (d.dir === 'flat') return <span className="an-delta" data-dir="flat">—</span>;
  return <span className="an-delta" data-dir={d.dir}>{d.dir === 'up' ? '▲' : '▼'}{d.pct}%</span>;
}

/* count-up that respects reduced motion */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduce = useReducedMotion();
  const spring = useSpring(reduce ? value : 0, { stiffness: 90, damping: 20 });
  useEffect(() => { spring.set(value); }, [value, spring]);
  const text = useTransform(spring, (v) => (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()));
  if (reduce) return <>{decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()}</>;
  return <motion.span>{text}</motion.span>;
}

/* CSS mini bar chart — peak bar is highlighted */
function Spark({ bars }: { bars: Array<{ label: string; value: number; hint: string }> }) {
  const reduce = useReducedMotion();
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => b.value)) || 1;
  const peak = bars.reduce((mi, b, i, arr) => (b.value > arr[mi].value ? i : mi), 0);
  const showLabels = bars.length <= 14;
  return (
    <div className={'an-spark' + (showLabels ? '' : ' nolabels')} role="img" aria-label={bars.map((b) => b.hint).join(', ')}>
      {bars.map((b, i) => (
        <div className="an-spark-col" key={i} title={b.hint}>
          <motion.div className="an-spark-bar" data-on={i === peak || undefined}
            initial={reduce ? false : { height: 0 }} animate={{ height: `${Math.max(8, (b.value / max) * 100)}%` }}
            transition={{ delay: reduce ? 0 : 0.05 + Math.min(i, 20) * 0.03, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} />
          {showLabels && <span className="an-spark-lbl">{b.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ===================================================================== */
/* Order-status segmented bar                                             */
/* ===================================================================== */
function StatusBreakdown({ s, t }: { s: Summary; t: T }) {
  const reduce = useReducedMotion();
  const segs = [
    { k: 'a_completed', n: s.completedOrders, c: 'var(--lime)' },
    { k: 'a_ready', n: s.readyOrders, c: 'var(--ready)' },
    { k: 'a_inprogress', n: s.acceptedOrders + s.preparingOrders, c: 'var(--accepted)' },
    { k: 'a_pending', n: s.pendingOrders, c: 'var(--pending)' },
    { k: 'a_cancelled', n: s.declinedOrders + s.cancelledOrders, c: 'var(--bad)' },
  ].filter((x) => x.n > 0);
  const total = segs.reduce((a, b) => a + b.n, 0);
  if (total === 0) return <p className="an-empty">{t('a_noOrders')}</p>;
  return (
    <>
      <motion.div className="an-status-bar" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
        {segs.map((g) => <div key={g.k} className="an-status-seg" style={{ flex: g.n, background: g.c }} title={`${t(g.k)} · ${g.n}`} />)}
      </motion.div>
      <motion.ul className="an-status-legend" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
        {segs.map((g) => (
          <motion.li key={g.k} variants={itemV}><span className="an-dot" style={{ background: g.c }} />{t(g.k)} <b className="num">{g.n}</b></motion.li>
        ))}
      </motion.ul>
    </>
  );
}

/* ===================================================================== */
/* Pro · conversion funnel (menu view → cart → checkout → order)          */
/* ===================================================================== */
function FunnelCard({ data, t }: { data: Funnel; t: T }) {
  const reduce = useReducedMotion();
  const stages = [
    { key: 'a_fn_views', n: data.menuViews },
    { key: 'a_fn_cart', n: data.addedToCart },
    { key: 'a_fn_checkout', n: data.checkoutStarted },
    { key: 'a_fn_orders', n: data.ordersPlaced },
  ];
  const top = stages[0].n || 1;
  const overall = data.menuViews > 0 ? Math.round((data.ordersPlaced / data.menuViews) * 100) : 0;
  return (
    <section className="an-card">
      <div className="an-card-head">
        <h3>{t('a_funnel')} <small>{t('a_fn_sub')}</small></h3>
        <span className="an-fn-overall">{overall}<small>%</small></span>
      </div>
      {data.menuViews === 0 ? <p className="an-empty">{t('a_noData')}</p> : (
        <motion.ul className="an-funnel" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
          {stages.map((s, i) => {
            const step = i > 0 && stages[i - 1].n > 0 ? Math.round((s.n / stages[i - 1].n) * 100) : null;
            return (
              <motion.li className="an-fn-row" key={s.key} variants={itemV}>
                <div className="an-fn-top">
                  <span className="an-fn-label">{t(s.key)}</span>
                  <span className="an-fn-n num">{s.n.toLocaleString()}{step !== null && <i className="an-fn-step">{step}%</i>}</span>
                </div>
                <div className="an-fn-track">
                  <motion.div className="an-fn-fill" style={{ width: `${(s.n / top) * 100}%` }}
                    initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: reduce ? 0 : 0.1 + i * 0.08, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }} />
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
}

/* ===================================================================== */
/* Pro · item conversion as horizontal bars                               */
/* ===================================================================== */
function ConversionBars({ rows, nm, t }: { rows: Conversion[]; nm: (en: string, ar: string) => string; t: T }) {
  const reduce = useReducedMotion();
  const weakId = rows.filter((c) => c.views >= 5).sort((a, b) => Number(a.conversionRate) - Number(b.conversionRate))[0]?.menuItemId;
  return (
    <motion.ul className="an-convbars" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
      {rows.map((c, i) => {
        const pct = Math.round(Number(c.conversionRate) * 100);
        return (
          <motion.li key={c.menuItemId} variants={itemV}>
            <div className="an-rankrow-top">
              <span className="an-li-name">{nm(c.nameEn, c.nameAr)}{c.menuItemId === weakId && <i className="an-flag">{t('a_low')}</i>}</span>
              <span className="an-li-val">{pct}% · {c.views} {t('a_views')}</span>
            </div>
            <div className="an-bar"><motion.div className={'an-bar-fill' + (c.menuItemId === weakId ? ' warn' : '')} style={{ width: `${Math.min(100, pct)}%` }}
              initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduce ? 0 : 0.12 + i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} /></div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ---- Trend chart (multi-day) ---- */
function TrendCard({ data, lang, cur, t, days }: { data: DailyPoint[]; lang: string; cur: string; t: T; days: number }) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const byWeekday = days <= 8;
  const chartData = useMemo(() => data.map((d) => ({
    day: byWeekday ? (lang === 'ar' ? WEEK_AR : WEEK_EN)[dowIndex(d.date)] : fmtDate(d.date, lang, { day: 'numeric', month: 'short' }),
    revenue: Number(d.revenue), orders: d.orders,
  })), [data, lang, byWeekday]);
  const sub = byWeekday ? t('a_trendSub') : `${data.length} ${t('a_daysN')}`;

  return (
    <section className="an-card">
      <div className="an-card-head">
        <h3>{t('a_trend')} <small>{sub}</small></h3>
        <div className="an-trend-toggle">
          <button className={metric === 'revenue' ? 'on' : ''} onClick={() => setMetric('revenue')}>{t('a_metricRev')}</button>
          <button className={metric === 'orders' ? 'on' : ''} onClick={() => setMetric('orders')}>{t('a_metricOrd')}</button>
        </div>
      </div>
      <div className="an-chart tall">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
            <defs><linearGradient id="limeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={LIME} stopOpacity={0.35} /><stop offset="100%" stopColor={LIME} stopOpacity={0.02} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={{ stroke: INK, strokeWidth: 1.5 }} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
            <YAxis tick={{ fill: MUTED, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<TrendTooltip metric={metric} cur={cur} t={t} />} cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey={metric} stroke={INK} strokeWidth={2} fill="url(#limeFill)" dot={byWeekday ? { r: 3, fill: LIME, stroke: INK, strokeWidth: 1 } : false} activeDot={{ r: 5, fill: LIME, stroke: INK, strokeWidth: 1.5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TrendTooltip({ active, payload, label, metric, cur, t }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; metric: string; cur: string; t: T }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const formatted = metric === 'revenue' ? `${Number(v).toFixed(3)} ${cur}` : `${Math.round(v)} ${t('a_ordersN')}`;
  return <div className="an-tip"><b>{label}</b><br /><span className="v">{formatted}</span></div>;
}

/* ---- Weekly rhythm — one self-drawing demand curve per weekday ---- */
const RH_W = 100, RH_H = 30, RH_PAD = 3;
function WeeklyRhythm({ slots, lang, t }: { slots: ForecastSlot[]; lang: string; t: T }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<{ row: number; idx: number } | null>(null);

  const { rows, busiest, hours, maxV, hasData } = useMemo(() => {
    const m = new Map<string, number>(); let mx = 0; const hrs = new Set<number>();
    for (const sl of slots) { m.set(`${sl.dayOfWeek}-${sl.hour}`, sl.expectedOrders); if (sl.expectedOrders > 0) { hrs.add(sl.hour); if (sl.expectedOrders > mx) mx = sl.expectedOrders; } }
    const hours = [...hrs].sort((a, b) => a - b);
    const maxV = mx || 1;
    const xFor = (i: number, n: number) => (n <= 1 ? RH_W / 2 : (i / (n - 1)) * RH_W);
    const yFor = (v: number) => RH_H - RH_PAD - (v / maxV) * (RH_H - 2 * RH_PAD);
    const built = [1, 2, 3, 4, 5, 6, 7].map((d) => {
      const vals = hours.map((h) => m.get(`${d}-${h}`) ?? 0);
      const n = vals.length;
      let pk = 0; vals.forEach((v, i) => { if (v > vals[pk]) pk = i; });
      const line = vals.map((v, i) => `${i ? 'L' : 'M'}${xFor(i, n).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ');
      const area = `M${xFor(0, n).toFixed(1)} ${RH_H} ${vals.map((v, i) => `L${xFor(i, n).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ')} L${xFor(n - 1, n).toFixed(1)} ${RH_H} Z`;
      return {
        d, line, area, vals,
        peakHour: hours[pk], peakVal: vals[pk], total: vals.reduce((a, b) => a + b, 0),
        peakX: n <= 1 ? 50 : (pk / (n - 1)) * 100,
        peakY: 100 * (RH_PAD + (vals[pk] / maxV) * (RH_H - 2 * RH_PAD)) / RH_H,
      };
    });
    let bd = 0; built.forEach((r, i) => { if (r.total > built[bd].total) bd = i; });
    return { rows: built, busiest: bd, hours, maxV, hasData: hours.length > 0 };
  }, [slots]);

  if (!hasData) return <p className="an-empty">{t('a_noData')}</p>;

  const n = hours.length;
  const xPct = (idx: number) => (n <= 1 ? 50 : (idx / (n - 1)) * 100);
  const bottomPct = (v: number) => (100 * (RH_PAD + (v / maxV) * (RH_H - 2 * RH_PAD))) / RH_H;
  // Four evenly-spaced hour ticks; flex space-between lands them on these fractions.
  const ticks = Array.from(new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]));
  const week = lang === 'ar' ? WEEK_AR : WEEK_EN;

  return (
    <motion.div className="an-rhythm" variants={listV} initial={reduce ? false : 'hidden'} animate="show">
      {rows.map((r, i) => {
        const h = hover?.row === i ? hover.idx : null;
        return (
          <motion.div className={'an-rhythm-row' + (i === busiest ? ' is-peak' : '')} key={r.d} variants={itemV}>
            <span className={'an-rhythm-day' + (r.d >= 5 ? ' wknd' : '')}>{week[r.d]}</span>
            <div className="an-rhythm-plot"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = rect.width ? (e.clientX - rect.left) / rect.width : 0;
                setHover({ row: i, idx: Math.max(0, Math.min(n - 1, Math.round(x * (n - 1)))) });
              }}
              onMouseLeave={() => setHover(null)}>
              <svg viewBox={`0 0 ${RH_W} ${RH_H}`} preserveAspectRatio="none" aria-hidden>
                <motion.path d={r.area} className="an-rhythm-area"
                  initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.1 + i * 0.07, duration: 0.5 }} />
                <motion.path d={r.line} className="an-rhythm-line" vectorEffect="non-scaling-stroke"
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.12 + i * 0.07, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
              </svg>
              {r.peakVal > 0 && h === null && (
                <motion.span className="an-rhythm-dot" style={{ left: `${r.peakX}%`, bottom: `${r.peakY}%` }}
                  initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: reduce ? 0 : 0.55 + i * 0.07, type: 'spring', stiffness: 320, damping: 18 }} />
              )}
              {h !== null && (
                <>
                  <span className="an-rhythm-guide" style={{ left: `${xPct(h)}%` }} />
                  <span className="an-rhythm-hoverdot" style={{ left: `${xPct(h)}%`, bottom: `${bottomPct(r.vals[h])}%` }} />
                  <span className="an-rhythm-tip" style={{ left: `${xPct(h)}%` }}>
                    <b>{hourLabel(hours[h])}</b> · {r.vals[h].toFixed(1)}
                  </span>
                </>
              )}
            </div>
            <span className="an-rhythm-peak">{r.peakVal > 0 ? <b>{hourLabel(r.peakHour)}</b> : <i className="an-rhythm-quiet">—</i>}</span>
          </motion.div>
        );
      })}
      <div className="an-rhythm-axis">
        <span />
        <div className="an-rhythm-axis-track">
          {ticks.map((idx) => <span key={idx} className="an-rhythm-tick">{hourLabel(hours[idx])}</span>)}
        </div>
        <span />
      </div>
      <div className="an-rhythm-foot">{t('a_rhythmHint')}</div>
    </motion.div>
  );
}

/* ---- horizontal meter rows (shared by daypart + kitchen timing) ---- */
function MeterRows({ rows }: { rows: Array<{ label: string; pct: number; value: string; hot?: boolean }> }) {
  const reduce = useReducedMotion();
  return (
    <div className="an-meter">
      {rows.map((r, i) => (
        <div className="an-meter-row" key={i}>
          <span className="an-meter-lbl">{r.label}</span>
          <span className="an-meter-track">
            <motion.span className="an-meter-fill" data-hot={r.hot || undefined}
              style={{ width: `${Math.max(2, r.pct)}%` }}
              initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: reduce ? 0 : 0.08 + i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
          </span>
          <span className="an-meter-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Daypart breakdown — orders & revenue by part of day ---- */
const DAYPART_KEY: Record<string, string> = {
  MORNING: 'a_dp_morning', MIDDAY: 'a_dp_midday', AFTERNOON: 'a_dp_afternoon', EVENING: 'a_dp_evening', LATE: 'a_dp_late',
};
function DaypartCard({ rows, t }: { rows: DaypartPoint[]; t: T }) {
  const total = rows.reduce((a, b) => a + b.orders, 0);
  if (total === 0) return <p className="an-empty">{t('a_noOrders')}</p>;
  const max = Math.max(...rows.map((r) => r.orders), 1);
  const peak = rows.reduce((mi, r, i, arr) => (r.orders > arr[mi].orders ? i : mi), 0);
  const meterRows = rows.map((r, i) => ({
    label: t(DAYPART_KEY[r.daypart] ?? r.daypart),
    pct: (r.orders / max) * 100,
    value: `${r.orders} · ${omr(r.revenue)}`,
    hot: i === peak,
  }));
  return <MeterRows rows={meterRows} />;
}

/* ---- Kitchen timing — avg seconds per fulfillment stage, bottleneck flagged ---- */
function fmtDur(sec: number | null, t: T): string {
  if (sec == null) return t('a_never');
  const s = Math.round(sec);
  if (s < 60) return `${s}${t('a_sec')}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}${t('a_min')} ${r}${t('a_sec')}` : `${m}${t('a_min')}`;
}
function KitchenCard({ d, t }: { d: KitchenTiming; t: T }) {
  if (!d.sampleOrders) return <p className="an-empty">{t('a_noData')}</p>;
  const stages = [
    { k: 'a_kt_accept', v: d.acceptSeconds },
    { k: 'a_kt_prep', v: d.prepSeconds },
    { k: 'a_kt_handoff', v: d.handoffSeconds },
  ];
  const max = Math.max(...stages.map((s) => s.v ?? 0), 1);
  let slowIdx = -1, slowVal = -1;
  stages.forEach((s, i) => { if (s.v != null && s.v > slowVal) { slowVal = s.v; slowIdx = i; } });
  const meterRows = stages.map((s, i) => ({
    label: t(s.k), pct: s.v != null ? (s.v / max) * 100 : 0, value: fmtDur(s.v, t), hot: i === slowIdx,
  }));
  return (
    <>
      <MeterRows rows={meterRows} />
      <div className="an-kt-foot">
        <span>{t('a_kt_toReady')} <b>{fmtDur(d.toReadySeconds, t)}</b></span>
        <span className="dot">·</span>
        <span>{t('a_kt_total')} <b>{fmtDur(d.toCompleteSeconds, t)}</b></span>
        {slowIdx >= 0 && <span className="an-kt-slow">{t('a_kt_bottleneck')}: {t(stages[slowIdx].k)}</span>}
      </div>
      <p className="an-kt-sample">{t('a_kt_sample').replace('{n}', String(d.sampleOrders))}</p>
    </>
  );
}

/* ---- Customer base — repeat rate, frequency, new vs returning split ---- */
function CustomerBaseCard({ d, t }: { d: CustomerBase; t: T }) {
  const reduce = useReducedMotion();
  const repeatShare = Math.min(100, Math.max(0, d.repeatOrderSharePercent));
  return (
    <div className="an-cb">
      <div className="an-cb-head">
        <div className="an-cb-rate">
          <span className="an-cb-pct"><CountUp value={d.repeatRatePercent} /><small>%</small></span>
          <span className="an-cb-rate-lbl">{t('a_cb_repeat')}</span>
        </div>
        <p className="an-cb-sub">{t('a_cb_repeatSub').replace('{r}', String(d.repeatCustomers)).replace('{n}', String(d.totalCustomers))}</p>
      </div>
      <div className="an-cb-stats">
        <div className="an-cb-stat"><b>{d.avgOrdersPerCustomer.toFixed(1)}</b><small>{t('a_cb_avg')}</small></div>
        <div className="an-cb-stat"><b>{d.newCustomers}</b><small>{t('a_cb_new')}</small></div>
        <div className="an-cb-stat"><b>{d.activeCustomers}</b><small>{t('a_cb_active')}</small></div>
      </div>
      <div className="an-cb-split">
        <div className="an-cb-split-bar">
          <motion.div className="an-cb-split-fill" style={{ width: `${repeatShare}%` }}
            initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
        </div>
        <div className="an-cb-split-legend">
          <span><i className="dot-repeat" /> {t('a_cb_returningOrders')} {repeatShare}%</span>
          <span><i className="dot-new" /> {t('a_cb_newOrders')} {100 - repeatShare}%</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Benchmark row ---- */
function BenchRow({ label, you, median, pct, t }: { label: string; you: string; median: string; pct: number; t: T }) {
  return (
    <div className="an-bench-row">
      <div className="an-bench-top"><span>{label}</span><b>{pct}<small>%</small> {t('a_percentile')}</b></div>
      <div className="an-bench-vals"><span>{t('a_you')}: <b>{you}</b></span><span>{t('a_median')}: {median}</span></div>
      <div className="an-bench-bar"><div className="an-bench-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
    </div>
  );
}

/* ---- pro upsell (shown on locked tabs / cards) ---- */
function ProUpsell({ desc, tags, t }: { desc: string; tags: string[]; t: T }) {
  return (
    <div className="an-lock">
      <div className="an-lock-body">
        <b>{t('a_lockTitle')}</b>
        <p>{desc}</p>
        <div className="an-lock-tags">{tags.map((x) => <span key={x}>{x}</span>)}</div>
      </div>
      <button className="an-lock-cta">{t('a_lockCta')} →</button>
    </div>
  );
}

/* ---- error card ---- */
function ErrCard({ message, onRetry, t }: { message: string; onRetry: () => void; t: T }) {
  return (
    <div className="an-errcard">
      <p>{message}</p>
      <button className="an-retry" onClick={onRetry}>{t('a_retry')}</button>
    </div>
  );
}

/* ---- loading skeleton ---- */
function Skeleton({ cards }: { cards?: number }) {
  if (cards) {
    return (
      <div className="an-grid" aria-hidden>
        {Array.from({ length: cards }).map((_, i) => <div key={i} className="an-skel card" />)}
      </div>
    );
  }
  return (
    <div className="an-skel-wrap" aria-hidden>
      <div className="an-skel hero" />
      <div className="an-skel strip" />
      <div className="an-grid">
        <div className="an-skel card" />
        <div className="an-skel card" />
      </div>
    </div>
  );
}
