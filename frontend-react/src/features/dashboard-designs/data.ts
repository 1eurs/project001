// ============================================================================
// Shared mock data for the Serva. dashboard design gallery (/designs).
// Every design renders the SAME numbers so they can be compared fairly.
// Realistic Omani-café figures: OMR with 3 decimals, café open 07:00–22:00.
// ============================================================================

export const omr = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const omr0 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const CAFE = {
  name: 'Najma Café',
  nameAr: 'مقهى نجمة',
  branch: 'Qurum',
  branchAr: 'القرم',
  branches: ['Qurum', 'Al Mouj', 'Nizwa'],
  date: 'Saturday · 6 Jun',
  dateAr: 'السبت · ٦ يونيو',
};

export const KPIS = {
  revenue: 486.25,
  revenueDelta: 12.4,
  orders: 142,
  ordersDelta: 8.2,
  avgOrder: 3.424,
  avgOrderDelta: 3.1,
  prepMins: 7.4,
  prepDelta: -0.6,
  liveNow: 9,
  paidRate: 87,
  guests: 318,
  guestsDelta: 5.5,
};

// Hourly revenue + order counts across the operating day.
export type HourPoint = { h: string; rev: number; orders: number };
export const HOURLY: HourPoint[] = [
  { h: '07', rev: 12.4, orders: 6 },
  { h: '08', rev: 31.2, orders: 13 },
  { h: '09', rev: 44.8, orders: 17 },
  { h: '10', rev: 38.1, orders: 14 },
  { h: '11', rev: 29.6, orders: 11 },
  { h: '12', rev: 41.3, orders: 15 },
  { h: '13', rev: 52.9, orders: 19 },
  { h: '14', rev: 36.7, orders: 12 },
  { h: '15', rev: 28.4, orders: 10 },
  { h: '16', rev: 33.9, orders: 12 },
  { h: '17', rev: 47.2, orders: 16 },
  { h: '18', rev: 58.6, orders: 21 },
  { h: '19', rev: 51.0, orders: 18 },
  { h: '20', rev: 39.2, orders: 14 },
];

// Week so far (Oman week: Sat → Fri). Today = Sat, the live bar.
export type DayPoint = { d: string; dAr: string; rev: number; today?: boolean };
export const WEEK: DayPoint[] = [
  { d: 'Sat', dAr: 'سبت', rev: 486.25, today: true },
  { d: 'Sun', dAr: 'أحد', rev: 512.8 },
  { d: 'Mon', dAr: 'إثنين', rev: 398.4 },
  { d: 'Tue', dAr: 'ثلاثاء', rev: 441.9 },
  { d: 'Wed', dAr: 'أربعاء', rev: 467.0 },
  { d: 'Thu', dAr: 'خميس', rev: 603.2 },
  { d: 'Fri', dAr: 'جمعة', rev: 558.7 },
];

export type Item = { name: string; nameAr: string; qty: number; rev: number; emoji: string };
export const TOP_ITEMS: Item[] = [
  { name: 'Omani Latte', nameAr: 'لاتيه عماني', qty: 38, rev: 91.2, emoji: '☕' },
  { name: 'Karak Tea', nameAr: 'شاي كرك', qty: 33, rev: 39.6, emoji: '🫖' },
  { name: 'Date Cake', nameAr: 'كيكة تمر', qty: 21, rev: 37.8, emoji: '🍰' },
  { name: 'Cold Brew', nameAr: 'قهوة باردة', qty: 18, rev: 37.8, emoji: '🧊' },
  { name: 'Zaatar Croissant', nameAr: 'كرواسون زعتر', qty: 16, rev: 25.6, emoji: '🥐' },
  { name: 'Saffron Cake', nameAr: 'كيك زعفران', qty: 12, rev: 26.4, emoji: '🧁' },
];

export type Channel = { key: string; label: string; labelAr: string; count: number; icon: string; color: string };
export const CHANNELS: Channel[] = [
  { key: 'dine', label: 'Dine-in', labelAr: 'صالة', count: 82, icon: '🪑', color: '#10b981' },
  { key: 'take', label: 'Takeaway', labelAr: 'سفري', count: 39, icon: '🥡', color: '#5AA9FF' },
  { key: 'car', label: 'Car', labelAr: 'سيارة', count: 21, icon: '🚗', color: '#F5B83D' },
];

export type LiveOrder = {
  no: string; type: 'DINE_IN' | 'TAKEAWAY' | 'CAR'; where: string;
  items: number; total: number; status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY';
  mins: string; lines: string[];
};
export const LIVE: LiveOrder[] = [
  { no: 'A-1042', type: 'DINE_IN', where: 'Table 12', items: 2, total: 4.2, status: 'PREPARING', mins: '03:20', lines: ['2× Omani Latte'] },
  { no: 'A-1041', type: 'CAR', where: 'Plate 4821', items: 1, total: 2.1, status: 'READY', mins: '06:05', lines: ['1× Cold Brew'] },
  { no: 'A-1040', type: 'TAKEAWAY', where: 'Takeaway', items: 3, total: 5.65, status: 'PENDING', mins: '00:45', lines: ['1× Date Cake', '2× Karak Tea'] },
  { no: 'A-1039', type: 'DINE_IN', where: 'Table 4', items: 4, total: 8.4, status: 'ACCEPTED', mins: '01:50', lines: ['4× Saffron Cake'] },
  { no: 'A-1038', type: 'DINE_IN', where: 'Table 9', items: 2, total: 3.8, status: 'PREPARING', mins: '04:35', lines: ['2× Zaatar Croissant'] },
];

export const STATUS_LABEL: Record<LiveOrder['status'], string> = {
  PENDING: 'New', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready',
};
export const STATUS_COLOR: Record<LiveOrder['status'], string> = {
  PENDING: '#F5B83D', ACCEPTED: '#5AA9FF', PREPARING: '#B08CFF', READY: '#3DE0A0',
};
export const TYPE_ICON: Record<LiveOrder['type'], string> = {
  DINE_IN: '🪑', TAKEAWAY: '🥡', CAR: '🚗',
};

// Mini "tables" floor for designs that show a room map.
export const TABLES = [
  { n: '1', state: 'free' }, { n: '2', state: 'busy' }, { n: '3', state: 'busy' },
  { n: '4', state: 'order' }, { n: '5', state: 'free' }, { n: '6', state: 'busy' },
  { n: '7', state: 'free' }, { n: '8', state: 'busy' }, { n: '9', state: 'order' },
  { n: '10', state: 'free' }, { n: '11', state: 'busy' }, { n: '12', state: 'order' },
] as const;

// ----------------------------------------------------------------------------
// Tiny dependency-free SVG chart helpers.
// ----------------------------------------------------------------------------

/** Smooth (Catmull-Rom → bezier) line path through values mapped into a w×h box. */
export function smoothLine(values: number[], w: number, h: number, pad = 2): string {
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const dx = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * dx, pad + (h - pad * 2) * (1 - (v - min) / span)] as const);
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Same as smoothLine but closed into the bottom edge for an area fill. */
export function smoothArea(values: number[], w: number, h: number, pad = 2): string {
  const line = smoothLine(values, w, h, pad);
  if (!line) return '';
  return `${line} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`;
}

/** Points for a polyline (sharp) chart. */
export function points(values: number[], w: number, h: number, pad = 2): string {
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const dx = (w - pad * 2) / (values.length - 1);
  return values.map((v, i) => `${pad + i * dx},${pad + (h - pad * 2) * (1 - (v - min) / span)}`).join(' ');
}

/** Donut segments → array of { dash, offset, color } for stroke-dasharray rings. */
export function donut(parts: { value: number; color: string }[], circumference: number) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let acc = 0;
  return parts.map((p) => {
    const frac = p.value / total;
    const seg = { color: p.color, dash: frac * circumference, gap: circumference - frac * circumference, offset: -acc * circumference, pct: Math.round(frac * 100) };
    acc += frac;
    return seg;
  });
}

// ============================================================================
// Extra data for the multi-page dashboard kit (Live / Orders / Menu / Tables)
// ============================================================================

export type HistStatus = 'COMPLETED' | 'PREPARING' | 'READY' | 'DECLINED' | 'CANCELLED' | 'PENDING';
export type HistOrder = {
  no: string; time: string; type: 'DINE_IN' | 'TAKEAWAY' | 'CAR'; where: string;
  status: HistStatus; paid: boolean; total: number; items: number;
};
export const ORDERS_HISTORY: HistOrder[] = [
  { no: 'A-1042', time: '14:35', type: 'DINE_IN', where: 'Table 12', status: 'PREPARING', paid: false, total: 4.2, items: 2 },
  { no: 'A-1041', time: '14:31', type: 'CAR', where: 'Plate 4821', status: 'READY', paid: true, total: 2.1, items: 1 },
  { no: 'A-1040', time: '14:28', type: 'TAKEAWAY', where: 'Takeaway', status: 'PENDING', paid: false, total: 5.65, items: 3 },
  { no: 'A-1039', time: '14:22', type: 'DINE_IN', where: 'Table 4', status: 'COMPLETED', paid: true, total: 8.4, items: 4 },
  { no: 'A-1038', time: '14:17', type: 'DINE_IN', where: 'Table 9', status: 'COMPLETED', paid: true, total: 3.8, items: 2 },
  { no: 'A-1037', time: '14:09', type: 'CAR', where: 'Plate 1190', status: 'COMPLETED', paid: true, total: 6.3, items: 3 },
  { no: 'A-1036', time: '14:02', type: 'TAKEAWAY', where: 'Takeaway', status: 'DECLINED', paid: false, total: 2.4, items: 1 },
  { no: 'A-1035', time: '13:54', type: 'DINE_IN', where: 'Table 2', status: 'COMPLETED', paid: true, total: 11.2, items: 5 },
  { no: 'A-1034', time: '13:48', type: 'DINE_IN', where: 'Table 7', status: 'COMPLETED', paid: true, total: 5.0, items: 2 },
  { no: 'A-1033', time: '13:41', type: 'CAR', where: 'Plate 7745', status: 'CANCELLED', paid: false, total: 3.6, items: 2 },
  { no: 'A-1032', time: '13:33', type: 'TAKEAWAY', where: 'Takeaway', status: 'COMPLETED', paid: true, total: 4.8, items: 2 },
  { no: 'A-1031', time: '13:25', type: 'DINE_IN', where: 'Table 11', status: 'COMPLETED', paid: true, total: 7.9, items: 4 },
];
export const HIST_COLOR: Record<HistStatus, string> = {
  PENDING: '#F5B83D', PREPARING: '#B08CFF', READY: '#3DE0A0', COMPLETED: '#7c8591', DECLINED: '#FF6B5A', CANCELLED: '#7c8591',
};

export type MenuItem = { name: string; nameAr: string; price: number; desc: string; emoji: string; available: boolean; prep?: number };
export type MenuCat = { name: string; nameAr: string; items: MenuItem[] };
export const MENU: MenuCat[] = [
  { name: 'Drinks', nameAr: 'المشروبات', items: [
    { name: 'Omani Latte', nameAr: 'لاتيه عماني', price: 2.4, desc: 'Milk, Arabic coffee, cardamom', emoji: '☕', available: true, prep: 4 },
    { name: 'Karak Tea', nameAr: 'شاي كرك', price: 1.2, desc: 'Black tea, milk, saffron', emoji: '🫖', available: true, prep: 3 },
    { name: 'Cold Brew', nameAr: 'قهوة باردة', price: 2.1, desc: '18-hour steep, over ice', emoji: '🧊', available: true, prep: 2 },
    { name: 'Spanish Latte', nameAr: 'لاتيه إسباني', price: 2.6, desc: 'Condensed milk, espresso', emoji: '☕', available: false, prep: 4 },
  ] },
  { name: 'Desserts', nameAr: 'الحلويات', items: [
    { name: 'Date Cake', nameAr: 'كيكة تمر', price: 1.8, desc: 'Dates, tahini, sea salt', emoji: '🍰', available: true, prep: 2 },
    { name: 'Saffron Cake', nameAr: 'كيك زعفران', price: 2.2, desc: 'Saffron sponge, pistachio', emoji: '🧁', available: true, prep: 2 },
  ] },
  { name: 'Breakfast', nameAr: 'الفطور', items: [
    { name: 'Zaatar Croissant', nameAr: 'كرواسون زعتر', price: 1.6, desc: 'Butter croissant, zaatar', emoji: '🥐', available: true, prep: 6 },
    { name: 'Shakshuka', nameAr: 'شكشوكة', price: 3.2, desc: 'Eggs, tomato, chili', emoji: '🍳', available: true, prep: 9 },
  ] },
];

export const KIT_PAGES = ['overview', 'live', 'orders', 'menu', 'tables'] as const;
export type KitPage = (typeof KIT_PAGES)[number];
export const PAGE_META: Record<KitPage, { en: string; ar: string; icon: string }> = {
  overview: { en: 'Overview', ar: 'نظرة عامة', icon: '◳' },
  live: { en: 'Live orders', ar: 'الطلبات المباشرة', icon: '🍳' },
  orders: { en: 'Orders', ar: 'سجل الطلبات', icon: '🧾' },
  menu: { en: 'Menu', ar: 'القائمة', icon: '📋' },
  tables: { en: 'Tables & QR', ar: 'الطاولات', icon: '🔳' },
};
