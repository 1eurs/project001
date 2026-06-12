// ============================================================================
// Shared bilingual copy for the Serva. landing-page gallery (/landings).
// Every concept renders the SAME words so the choice is purely about design.
// Arabic-first (the product targets Omani cafés and food businesses), English ready.
// ============================================================================
import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';

export type Lang = 'ar' | 'en';

export const COPY = {
  ar: {
    dir: 'rtl' as const,
    nav: { how: 'كيف يعمل', features: 'الإمكانات', demo: 'العرض', request: 'اطلب حسابك', signin: 'دخول' },
    kicker: 'طلبك على بُعد مسحة واحدة',
    h1a: 'اطلب من', h1b: 'سيارتك', h1c: 'أو طاولتك',
    sub: 'دون تطبيق. دون طابور.',
    lead: 'منصّة عربية أولاً للطلب عبر رمز QR — للمقاهي والأنشطة الغذائية في عُمان. يمسح الزبون الرمز، يتصفّح القائمة، ويطلب من مكانه.',
    ctaPrimary: 'اطلب حسابك', ctaSecondary: 'شاهد العرض',
    stats: [
      { k: 'بلا تطبيق', v: 'يفتح في المتصفح' },
      { k: 'عربي/إنجليزي', v: 'تبديل فوري' },
      { k: '~٢ دقيقة', v: 'تجهيز القائمة' },
      { k: 'ر.ع', v: 'أسعار بالريال' },
    ],
    howLbl: 'كيف يعمل',
    steps: [
      { t: 'امسح الرمز', d: 'رمز QR عند الكاونتر أو الطاولة يفتح القائمة فوراً في المتصفح — دون أي تنزيل.' },
      { t: 'اختر واطلب', d: 'سلّة بسيطة بالعربية والإنجليزية، أسعار بالريال العُماني، وإرسالٌ بضغطة واحدة.' },
      { t: 'استلم طلبك', d: 'يصل الطلب إلى شاشة التحضير لحظياً مع تنبيه صوتي، ويتابع الزبون حالته حتى الاستلام.' },
    ],
    featLbl: 'الإمكانات',
    features: [
      { i: '🌐', t: 'عربي وإنجليزي', d: 'واجهة عربية أولاً مع تبديل فوري للّغة.' },
      { i: '🔔', t: 'شاشة التحضير', d: 'طلبات لحظية مع تنبيه صوتي على الهاتف.' },
      { i: '🧾', t: 'إدارة القائمة', d: 'أصناف وصور وتوفّر — بلمسة واحدة.' },
      { i: '🔳', t: 'رموز QR', d: 'للكاونتر أو لكل طاولة — أنشئ واطبع.' },
      { i: '💳', t: 'الدفع اختياري', d: 'نقد أو بطاقة عند الاستلام.' },
      { i: '📈', t: 'تقارير', d: 'مبيعات اليوم وأكثر الأصناف مبيعاً.' },
    ],
    demoLbl: 'العرض', demoH: 'شاهده حياً',
    demoGuest: 'هكذا يراها زبونك', demoGuestC: 'تجربة الطلب من السيارة',
    demoDash: 'لوحة الإدارة', demoDashC: 'شاشة التحضير والإدارة',
    reqLbl: 'اطلب حسابك', reqH: 'ابدأ مع نشاطك اليوم.',
    reqP: 'أنشئ حسابك بنفسك، أكمل خطوات التسجيل والدفع، وسنفعّله فور تأكيد التحويل.',
    form: { cafe: 'اسم المقهى / النشاط', name: 'اسمك', phone: 'رقم الجوال', city: 'المدينة', note: 'ملاحظة (اختياري)', send: 'أرسل الطلب', sending: 'جارٍ الإرسال…', okh: 'وصلنا طلبك ✓', okp: 'شكراً لك — سنتواصل معك قريباً.' },
    foot: { tagline: 'طلبك على بُعد مسحة واحدة.', contact: 'تواصل', rights: 'جميع الحقوق محفوظة', made: 'صُنع لمقاهي وأنشطة عُمان الغذائية' },
    phone: { brand: 'مقهى نجمة', cat: 'المشروبات', i1: 'لاتيه عماني', i1d: 'حليب، قهوة عربية، هيل', i2: 'شاي كرك', i2d: 'شاي أسود، حليب، زعفران', i3: 'كيكة تمر', cart: 'عرض السلة', total: '٢٫٤٠', scan: 'امسح للطلب' },
  },
  en: {
    dir: 'ltr' as const,
    nav: { how: 'How it works', features: 'Features', demo: 'Demo', request: 'Request access', signin: 'Sign in' },
    kicker: 'Your order, one scan away',
    h1a: 'Order from', h1b: 'your car', h1c: 'or your table',
    sub: 'No app. No queue.',
    lead: 'An Arabic-first QR ordering platform for Omani cafés and food businesses. Guests scan, browse the menu, and order right from their seat.',
    ctaPrimary: 'Request access', ctaSecondary: 'See the demo',
    stats: [
      { k: 'No app', v: 'opens in browser' },
      { k: 'AR / EN', v: 'instant switch' },
      { k: '~2 min', v: 'menu setup' },
      { k: 'OMR', v: 'native pricing' },
    ],
    howLbl: 'How it works',
    steps: [
      { t: 'Scan the code', d: 'A QR at the counter or table opens the menu instantly in the browser — no download.' },
      { t: 'Pick & order', d: 'A simple cart in Arabic or English, OMR pricing, and one-tap send.' },
      { t: 'Pick it up', d: 'The order hits the prep screen in realtime with a sound cue; the guest tracks it to pickup.' },
    ],
    featLbl: 'Capabilities',
    features: [
      { i: '🌐', t: 'Arabic & English', d: 'RTL-first interface with an instant language switch.' },
      { i: '🔔', t: 'Prep display', d: 'Realtime orders with a sound cue on any phone.' },
      { i: '🧾', t: 'Menu management', d: 'Items, photos, availability — in a tap.' },
      { i: '🔳', t: 'QR codes', d: 'For the counter or each table — generate & print.' },
      { i: '💳', t: 'Payments optional', d: 'Cash or card on pickup.' },
      { i: '📈', t: 'Reports', d: "Today’s sales and best sellers." },
    ],
    demoLbl: 'Demo', demoH: 'See it live',
    demoGuest: 'What your customer sees', demoGuestC: 'The order-from-car experience',
    demoDash: 'Dashboard', demoDashC: 'Prep display & management',
    reqLbl: 'Request access', reqH: 'Start with your business today.',
    reqP: 'Create your account yourself, complete onboarding and payment, and we’ll activate it once the transfer is confirmed.',
    form: { cafe: 'Business / café name', name: 'Your name', phone: 'Phone number', city: 'City', note: 'Note (optional)', send: 'Send request', sending: 'Sending…', okh: 'Got your request ✓', okp: 'Thank you — we’ll be in touch shortly.' },
    foot: { tagline: 'Your order, one scan away.', contact: 'Contact', rights: 'All rights reserved', made: 'Made for Omani cafés and food businesses' },
    phone: { brand: 'Najma Café', cat: 'Drinks', i1: 'Omani Latte', i1d: 'Milk, Arabic coffee, cardamom', i2: 'Karak Tea', i2d: 'Black tea, milk, saffron', i3: 'Date Cake', cart: 'View cart', total: '2.40', scan: 'Scan to order' },
  },
};

export type Copy = (typeof COPY)[Lang]; // union of ar|en shapes (dir: 'rtl'|'ltr')

/** Shared lead-capture logic; each design renders its own styled form around it. */
export function useLeadForm() {
  const toast = useToast();
  const [f, setF] = useState({ cafeName: '', contactName: '', phone: '', city: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = !!(f.cafeName.trim() && f.contactName.trim() && f.phone.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await api.post('/api/public/leads', f, { auth: false });
      setDone(true);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }
  return { f, set, submit, loading, done, valid };
}

export const DEMO_LINKS = {
  // wired to the seeded demo café so the CTA buttons actually open something
  customer: '/r/mutrah-coffee/b/1/t/Ymlr-a-6yIXejL60DOWdP4-b',
  dashboard: '/dashboard',
};
