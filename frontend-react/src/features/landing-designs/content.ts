// ============================================================================
// Shared bilingual copy for the Serva. landing-page gallery (/landings).
// Every concept renders the SAME words so the choice is purely about design.
// Arabic-first, English ready.
// ============================================================================
import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';

export type Lang = 'ar' | 'en';

export const COPY = {
  ar: {
    dir: 'rtl' as const,
    nav: { how: 'كيف يعمل', features: 'الإمكانات', pricing: 'السعر', faq: 'أسئلة', request: 'ابدأ الآن', signin: 'دخول' },
    kicker: 'الطابور ينتهي هنا',
    h1a: 'اطلب من', h1b: 'أي مكان', h1c: 'دون انتظار',
    sub: 'طاولة، كاونتر، أو سيارة — دون تطبيق.',
    lead: 'يمسح زبونك الرمز من طاولته أو من الطابور أو من سيارته، يتصفّح القائمة بالعربية أو الإنجليزية، ويطلب خلال ثوانٍ — دون تطبيق، ودون التلويح للنادل.',
    ctaPrimary: 'ابدأ استقبال الطلبات', ctaSecondary: 'شاهد العرض',
    stats: [
      { k: 'بلا تطبيق', v: 'يفتح في المتصفح' },
      { k: 'عربي/إنجليزي', v: 'تبديل فوري' },
      { k: '~٢ دقيقة', v: 'تجهيز القائمة' },
      { k: 'ر.ع', v: 'أسعار بالريال' },
    ],
    probLbl: 'المشكلة',
    probH1: 'طابور عند الكاونتر. تلويح للنادل. سيارات تنتظر.', probH2: 'الاختناق نفسه.',
    baBefore: {
      h: 'ساعة الذروة بدون Serva',
      items: [
        'طابور عند الكاشير، وزبائن ينسحبون منه.',
        'زبائن يلوّحون لنادلٍ يقوم بثلاث وظائف في الوقت نفسه.',
        'سيارات تنتظر في الخارج والموظفون يركضون ذهاباً وإياباً.',
        'طلبات تُملى وسط الضجيج — أخطاء، وإعادة تحضير، واعتذارات.',
      ],
    },
    baAfter: {
      h: 'ساعة الذروة مع Serva',
      items: [
        'كل طاولة وكاونتر وموقف سيارة يستقبل طلبه بنفسه.',
        'الطلبات تصل إلى شاشة التحضير لحظة تأكيدها.',
        'موظفوك يحضّرون المشروبات بدل تدوين الطلبات.',
        'طلبات مكتوبة كما كتبها الزبون تماماً — بلا إعادة تحضير.',
      ],
    },
    howLbl: 'كيف يعمل',
    steps: [
      { t: 'امسح الرمز', d: 'رمز QR على الطاولة أو الكاونتر أو لوحة الموقف يفتح القائمة فوراً في المتصفح — لا تنزيل ولا تثبيت.' },
      { t: 'اختر واطلب', d: 'سلّة سريعة بالعربية أو الإنجليزية، وإرسالٌ بضغطة واحدة — والزبون الدائم يجد بياناته معبّأة مسبقاً.' },
      { t: 'حضّر وقدّم', d: 'يصل الطلب إلى شاشة التحضير لحظياً مع تنبيه صوتي، ويتابع الزبون حالته حتى يجهز — لا أحد يسأل «هل جهز طلبي؟».' },
    ],
    magicLbl: 'المزايا',
    magicH1: 'ثلاثة أشياء', magicH2: 'لا تقدر عليها القائمة الورقية.',
    magic: [
      { k: 'ذاكرة الجهاز', t: 'يعرف زبائنك الدائمين', d: 'لحظة مسح الزبون العائد، يجد طلبه المفضّل ورقم هاتفه — وحتى رقم لوحة سيارته — معبّأة مسبقاً. من «وصلت للتو» إلى «أرسلت الطلب» في ثوانٍ، ويعود مرة بعد مرة لأن الطلب صار بلا مجهود.' },
      { k: 'مراقبة السلة', t: 'شاهد الطلبات قبل إرسالها', d: 'راقب السلال وهي تمتلئ لحظياً، قبل أن يضغط أحد «اطلب». ترى الذروة وهي تتشكّل، وتبدأ التحضير مبكراً، وتُسرّع دوران الطاولات.' },
      { k: 'هوية خاصة', t: 'قائمتك بهويتك أنت', d: 'ألوانك وشعارك وصورك. يشعر الزبون أن مقهاك بنى تطبيقه الفاخر الخاص — لا رابط قائمة عام يحمل اسم شركة أخرى.' },
    ],
    featLbl: 'كل شيء مشمول',
    features: [
      { i: '🌐', t: 'عربي وإنجليزي', d: 'واجهة عربية أولاً مع تبديل فوري — قائمة واحدة باللغتين.' },
      { i: '🔔', t: 'شاشة التحضير', d: 'طلبات لحظية مع تنبيه صوتي على أي جهاز.' },
      { i: '🧾', t: 'إدارة القائمة', d: 'أصناف وصور وتوفّر — بلمسة واحدة.' },
      { i: '🔳', t: 'رموز QR بهويتك', d: 'للطاولات أو الكاونتر أو المواقف — أنشئ واطبع.' },
      { i: '💳', t: 'الدفع اختياري', d: 'نقد أو بطاقة عند الاستلام — والدفع الإلكتروني اختياري.' },
      { i: '📈', t: 'تقارير', d: 'مبيعات اليوم وأكثر الأصناف مبيعاً، بنظرة واحدة.' },
      { i: '🚗', t: 'سيارة وطاولة معاً', d: 'الاستلام من السيارة والطلب من الطاولة في نظام واحد.' },
      { i: '📱', t: 'بلا أجهزة جديدة', d: 'يعمل في المتصفح على الهواتف وأي شاشة تملكها.' },
      { i: '🖨', t: 'فواتير', d: 'اطبع فاتورة مرتّبة لأي طلب.' },
    ],
    priceLbl: 'السعر',
    priceH: 'سعر واحد. كل شيء مشمول.',
    priceAmount: 'قريباً', pricePer: 'يُعلن السعر قريباً',
    priceP: 'باقة واحدة بسيطة وعادلة قادمة: بلا عمولات، وبلا رسوم على الطلبات، وبلا عقود معقّدة. نختار السعر المناسب ونعلنه قريباً.',
    priceItems: [
      'طلبات وأصناف بلا حدود',
      'تطبيق الزبون + شاشة التحضير + التقارير',
      'هويتك ورموز QR الخاصة بك مشمولة',
      'نفعّل حسابك فور تأكيد التحويل',
    ],
    faqLbl: 'أسئلة شائعة', faqH: 'سألتم، أجبنا.',
    faq: [
      { q: 'هل يحتاج زبائني إلى تنزيل تطبيق؟', a: 'لا. يفتح الرمز قائمتك مباشرة في المتصفح — سفاري أو كروم أو غيرهما. يمسح الزبون ويطلب خلال ثوانٍ.' },
      { q: 'هل يناسب الجلوس في المقهى والاستلام والسيارات؟', a: 'الثلاثة معاً. كل رمز يعرف مكانه — طاولة 7، أو الكاونتر، أو موقف 3 — فيصل كل طلب وعليه مكان صاحبه.' },
      { q: 'وماذا عن الدفع؟', a: 'القرار لك. معظم المقاهي تستلم نقداً أو بالبطاقة عند التسليم، تماماً كاليوم. Serva يلغي الانتظار في الطلب، لا تحكّمك في الدفع.' },
      { q: 'هل هو فعلاً بالعربية؟', a: 'عربي أولاً. قائمتك ومسار الطلب ولوحة التحكم كلها تعمل بالعربية والإنجليزية، بتبديل فوري.' },
      { q: 'ماذا أحتاج أن أركّب؟', a: 'لا شيء. اطبع الرموز، وافتح اللوحة على أي هاتف أو جهاز لوحي أو شاشة تملكها، وأنت جاهز.' },
      { q: 'كم التكلفة؟', a: 'سعر واحد بسيط لكل فرع سنوياً، بلا أي عمولة على الطلبات. سنعلن الرقم قريباً.' },
    ],
    reqLbl: 'ابدأ', reqH: 'ذروتك القادمة تدير نفسها.',
    reqP: 'أنشئ حسابك بنفسك وجهّز قائمتك خلال دقائق، وسنفعّله فور تأكيد التحويل. أو اترك بياناتك وسنتواصل معك.',
    form: { cafe: 'اسم المقهى / النشاط', name: 'اسمك', phone: 'رقم الجوال', city: 'المدينة', note: 'ملاحظة (اختياري)', send: 'أرسل الطلب', sending: 'جارٍ الإرسال…', okh: 'وصلنا طلبك ✓', okp: 'شكراً لك — سنتواصل معك قريباً.' },
    foot: { tagline: 'طلبك على بُعد مسحة واحدة.', contact: 'تواصل', rights: 'جميع الحقوق محفوظة', made: 'صُنع بحب للمقاهي والمطاعم' },
    phone: { brand: 'مقهى نجمة', cat: 'المشروبات', i1: 'لاتيه عماني', i1d: 'حليب، قهوة عربية، هيل', i2: 'شاي كرك', i2d: 'شاي أسود، حليب، زعفران', i3: 'كيكة تمر', cart: 'عرض السلة', total: '٢٫٤٠', scan: 'امسح للطلب' },
  },
  en: {
    dir: 'ltr' as const,
    nav: { how: 'How it works', features: 'Features', pricing: 'Pricing', faq: 'FAQ', request: 'Get started', signin: 'Sign in' },
    kicker: 'The line stops here',
    h1a: 'Order from', h1b: 'anywhere', h1c: 'without the wait',
    sub: 'Table, counter, or car — no app.',
    lead: 'Your customers scan a QR from the table, the line, or the car, browse your menu in Arabic or English, and order in seconds — no app, no waving for a waiter.',
    ctaPrimary: 'Start taking orders', ctaSecondary: 'Watch it work',
    stats: [
      { k: 'No app', v: 'opens in browser' },
      { k: 'AR / EN', v: 'instant switch' },
      { k: '~2 min', v: 'menu setup' },
      { k: 'OMR', v: 'native pricing' },
    ],
    probLbl: 'The problem',
    probH1: 'Counter lines. Waving hands. Waiting cars.', probH2: 'Same bottleneck.',
    baBefore: {
      h: 'Rush hour without Serva',
      items: [
        'A line at the register, and people walking away from it.',
        "Customers waving for a waiter who's already doing three jobs.",
        'Cars waiting outside while staff run back and forth.',
        'Orders dictated over noise — mistakes, remakes, apologies.',
      ],
    },
    baAfter: {
      h: 'Rush hour with Serva',
      items: [
        'Every table, counter spot, and parking bay takes its own order.',
        'Orders land on the prep screen the second they’re confirmed.',
        'Your staff make drinks instead of taking dictation.',
        'Orders written exactly as the customer typed them — no remakes.',
      ],
    },
    howLbl: 'How it works',
    steps: [
      { t: 'Scan the code', d: 'A QR on the table, the counter, or the parking sign opens the menu instantly in the browser — nothing to download.' },
      { t: 'Pick & order', d: 'A fast cart in Arabic or English, one-tap send — and returning customers find their details already filled in.' },
      { t: 'Make & serve', d: 'The order hits the prep screen in realtime with a sound cue; the guest tracks it until it’s ready — nobody asks “is it done yet?”' },
    ],
    magicLbl: 'Features',
    magicH1: 'Three things', magicH2: "paper menus can't do.",
    magic: [
      { k: 'Device memory', t: 'It knows your regulars', d: 'The moment a returning customer scans, their favorite order, phone number — even their car plate — are already filled in. Regulars go from “just parked” to “order sent” in seconds, and they keep coming back because ordering is effortless.' },
      { k: 'Live cart peek', t: 'See orders before they’re sent', d: 'Watch carts fill up in real time, before anyone presses “order”. You see the rush while it’s still forming, start prepping early, and turn tables faster.' },
      { k: 'Custom branding', t: 'Your menu, your brand', d: 'Your colors, your logo, your photos. To customers it feels like your café built its own premium app — not a generic menu link with somebody else’s name on it.' },
    ],
    featLbl: 'Everything included',
    features: [
      { i: '🌐', t: 'Arabic & English', d: 'RTL-first with an instant switch — one menu, both languages.' },
      { i: '🔔', t: 'Prep display', d: 'Realtime orders with a sound cue on any device.' },
      { i: '🧾', t: 'Menu management', d: 'Items, photos, availability — in a tap.' },
      { i: '🔳', t: 'QR codes in your brand', d: 'For tables, the counter, or parking bays — generate & print.' },
      { i: '💳', t: 'Payments optional', d: 'Cash or card on pickup — online payment optional.' },
      { i: '📈', t: 'Reports', d: 'Today’s sales and best sellers, at a glance.' },
      { i: '🚗', t: 'Car & table modes', d: 'Curbside and dine-in in one system.' },
      { i: '📱', t: 'No new hardware', d: 'Runs in the browser on phones and any screen you own.' },
      { i: '🖨', t: 'Invoices', d: 'Print a clean invoice for any order.' },
    ],
    priceLbl: 'Pricing',
    priceH: 'One price. Everything in.',
    priceAmount: 'Soon', pricePer: 'pricing announced soon',
    priceP: 'One simple, fair plan is coming: no commissions, no per-order fees, no contracts that need a lawyer. We’re setting the right price and will announce it soon.',
    priceItems: [
      'Unlimited orders & menu items',
      'Customer app + prep display + reports',
      'Your branding & QR codes included',
      'Activated as soon as your transfer is confirmed',
    ],
    faqLbl: 'Questions', faqH: 'Asked & answered.',
    faq: [
      { q: 'Do my customers need to download an app?', a: 'No. The QR opens your menu straight in the browser — Safari, Chrome, anything. They scan and they’re ordering within seconds.' },
      { q: 'Does it work for dine-in, takeaway, and cars?', a: 'All three. Each QR knows where it lives — table 7, the counter, or parking bay 3 — so every order arrives labeled with where its customer is.' },
      { q: 'What about payment?', a: 'Your call. Most cafés take cash or card at pickup, exactly like today. Serva removes the wait from ordering, not your control over payment.' },
      { q: 'Is it really in Arabic?', a: 'Arabic-first, actually. Your menu, the ordering flow, and your dashboard all work in Arabic and English, with an instant switch.' },
      { q: 'What do I need to install?', a: 'Nothing. Print the QR codes, open the dashboard on any phone, tablet, or screen you already own, and you’re live.' },
      { q: 'What does it cost?', a: 'One simple price per branch per year, with no commission on orders. We’ll announce the number soon.' },
    ],
    reqLbl: 'Get started', reqH: 'Your next rush hour can run itself.',
    reqP: 'Create your account and set up your menu in minutes — we activate it as soon as your transfer is confirmed. Or leave your details and we’ll call you.',
    form: { cafe: 'Business / café name', name: 'Your name', phone: 'Phone number', city: 'City', note: 'Note (optional)', send: 'Send request', sending: 'Sending…', okh: 'Got your request ✓', okp: 'Thank you — we’ll be in touch shortly.' },
    foot: { tagline: 'Your order, one scan away.', contact: 'Contact', rights: 'All rights reserved', made: 'Made with love for cafés & restaurants' },
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
