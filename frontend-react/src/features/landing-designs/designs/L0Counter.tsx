import { Link } from 'react-router-dom';
import { DEMO_LINKS, useLeadForm, type Lang } from '../content';
import './l0.css';

const C0 = {
  ar: {
    dir: 'rtl' as const,
    nav: ['المنتج', 'العملاء', 'الأسعار'], signin: 'دخول', cta: 'ابدأ مجاناً',
    eyebrow: 'Serva — للمقاهي وعربات الطعام في عُمان',
    h1a: 'الطلب يبدأ', h1b: 'لحظة جلوسهم.',
    sub: 'رمزٌ واحد على كل طاولة ونافذة سيارة. يتصفّح الزبون بالعربية أو الإنجليزية ويطلب بنفسه — وServa يرسله مباشرةً إلى شاشة المطبخ.',
    cta1: 'ابدأ مجاناً', cta2: 'احجز عرضاً',
    micro: 'بلا تطبيق للزبون · بلا أجهزة لك',
    trust: 'يخدم مقاهي عبر مسقط ونزوى وصلالة',
    logos: ['قُرم رُوسترز', 'الموج كوفي', 'بيت نزوى', 'مطرح وشركاه', 'دكان', 'كرك لاب'],
    dashKicker: 'لوحتك', dashH: 'كل طلب يصل لحظياً — مكتوباً وواضحاً.',
    dashP: 'شاشة تحضير حيّة بأعمدة: جديد، قيد التحضير، جاهز. تنبيه صوتي عند كل طلب، وكل شيء مسجّل.',
    feats: [
      { t: 'عربيٌّ أولاً', d: 'واجهة عربية بالكامل مع تبديل فوري للإنجليزية — على كل شاشة.' },
      { t: 'يصل للمطبخ فوراً', d: 'الطلب يظهر على الشاشة لحظياً مع نغمة تنبيه، دون كاشير.' },
      { t: 'رمز لكل طاولة', d: 'أنشئ واطبع رموز QR للطاولات أو لنافذة السيارة في ثوانٍ.' },
    ],
    metricsH: 'بسيط بقدر ما يجب أن يكون',
    metrics: [['دقيقتان', 'لنشر قائمتك'], ['صفر', 'تنزيلات تطبيق للزبون'], ['عربي/إنجليزي', 'على كل شاشة']],
    closeH: 'ضع Serva على طاولاتك.', closeP: 'اترك بياناتك ونجهّز حسابك خلال يوم عمل.',
    fCafe: 'اسم المقهى', fName: 'اسمك', fPhone: 'الجوال', fSend: 'ابدأ', fSending: '…', okh: 'وصلنا طلبك', okp: 'سنتواصل معك قريباً.',
    footTag: 'طبقة الطلب للمقاهي الحديثة.', made: 'صُنع في عُمان',
    fProduct: 'المنتج', fCompany: 'الشركة', fLegal: 'قانوني',
    fl: { menu: 'قائمة العملاء', kds: 'شاشة المطبخ', qr: 'رموز QR', reports: 'التقارير', about: 'من نحن', contact: 'تواصل', careers: 'وظائف', privacy: 'الخصوصية', terms: 'الشروط' },
  },
  en: {
    dir: 'ltr' as const,
    nav: ['Product', 'Customers', 'Pricing'], signin: 'Sign in', cta: 'Start free',
    eyebrow: 'Serva — for cafés & food trucks in Oman',
    h1a: 'Orders, the moment', h1b: 'they sit down.',
    sub: 'One code on every table and car window. Guests browse in Arabic or English and order themselves — Serva sends it straight to the kitchen screen.',
    cta1: 'Start free', cta2: 'Book a demo',
    micro: 'No app for guests · No hardware for you',
    trust: 'Serving cafés across Muscat, Nizwa & Salalah',
    logos: ['QURUM ROASTERS', 'AL MOUJ COFFEE', 'NIZWA HOUSE', 'MUTRAH & CO', 'DUKKAN', 'KARAK LAB'],
    dashKicker: 'Your view', dashH: 'Every order, the instant it’s placed — written and clear.',
    dashP: 'A live prep screen in columns: New, Preparing, Ready. A sound cue on each order, and everything logged.',
    feats: [
      { t: 'Arabic-first', d: 'A fully Arabic interface with an instant switch to English — on every screen.' },
      { t: 'Straight to the kitchen', d: 'Orders appear on the screen in realtime with a sound cue. No till.' },
      { t: 'A code per table', d: 'Generate and print QR codes for tables or the car window in seconds.' },
    ],
    metricsH: 'As simple as it should be',
    metrics: [['2 min', 'to publish your menu'], ['Zero', 'guest app downloads'], ['AR / EN', 'on every screen']],
    closeH: 'Put Serva on your tables.', closeP: 'Leave your details and we’ll set you up within a business day.',
    fCafe: 'Café name', fName: 'Your name', fPhone: 'Phone', fSend: 'Start', fSending: '…', okh: 'Got your request', okp: 'We’ll be in touch shortly.',
    footTag: 'The ordering layer for modern cafés.', made: 'Made in Oman',
    fProduct: 'Product', fCompany: 'Company', fLegal: 'Legal',
    fl: { menu: 'Customer menu', kds: 'Kitchen screen', qr: 'QR codes', reports: 'Reports', about: 'About', contact: 'Contact', careers: 'Careers', privacy: 'Privacy', terms: 'Terms' },
  },
};

const IconQr = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" /></svg>;
const IconBell = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" strokeLinejoin="round" /><path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" /></svg>;
const IconGlobe = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="8" /><path d="M3.5 9h17M3.5 15h17M12 4c2.2 2.4 2.2 13.6 0 16M12 4c-2.2 2.4-2.2 13.6 0 16" /></svg>;
const FEAT_ICONS = [<IconGlobe />, <IconBell />, <IconQr />];

export default function L0Counter({ lang }: { lang: Lang }) {
  const c = C0[lang];
  const form = useLeadForm();

  return (
    <div className="lz-screen c0" dir={c.dir}>
      <div className="c0-grain" aria-hidden />

      <nav className="c0-nav">
        <div className="c0-inner c0-navrow">
          <a className="c0-word">Serva</a>
          <div className="c0-navlinks">{c.nav.map((n) => <a key={n}>{n}</a>)}</div>
          <div className="c0-navr"><Link to="/dashboard" className="c0-signin">{c.signin}</Link><a href="#start" className="c0-btn">{c.cta}</a></div>
        </div>
      </nav>

      <header className="c0-hero">
        <div className="c0-inner c0-herogrid">
          <div className="c0-herocopy">
            <span className="c0-eyebrow">{c.eyebrow}</span>
            <h1>{c.h1a}<br />{c.h1b}</h1>
            <p className="c0-sub">{c.sub}</p>
            <div className="c0-cta"><a href="#start" className="c0-btn lg">{c.cta1}</a><Link to={DEMO_LINKS.customer} className="c0-btn link lg">{c.cta2} <span className="c0-arr">→</span></Link></div>
            <div className="c0-micro">{c.micro}</div>
          </div>
          <div className="c0-herovis"><MenuPhone lang={lang} /></div>
        </div>
      </header>

      <section className="c0-logos">
        <div className="c0-inner">
          <p className="c0-trust">{c.trust}</p>
          <div className="c0-logorow">{c.logos.map((l) => <span key={l}>{l}</span>)}</div>
        </div>
      </section>

      <section className="c0-product">
        <div className="c0-inner">
          <div className="c0-prodhead">
            <span className="c0-kicker">{c.dashKicker}</span>
            <h2>{c.dashH}</h2>
            <p>{c.dashP}</p>
          </div>
          <KdsBrowser lang={lang} />
        </div>
      </section>

      <section className="c0-feats">
        <div className="c0-inner c0-featgrid">
          {c.feats.map((f, i) => (
            <div className="c0-feat" key={f.t}>
              <span className="c0-ficon">{FEAT_ICONS[i]}</span>
              <h3>{f.t}</h3><p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="c0-metrics">
        <div className="c0-inner">
          <h2 className="c0-metricsh">{c.metricsH}</h2>
          <div className="c0-metricrow">
            {c.metrics.map((m) => <div className="c0-metric" key={m[1]}><b>{m[0]}</b><span>{m[1]}</span></div>)}
          </div>
        </div>
      </section>

      <section className="c0-close" id="start">
        <div className="c0-inner c0-closegrid">
          <div><h2>{c.closeH}</h2><p>{c.closeP}</p></div>
          {form.done ? (
            <div className="c0-ok"><h3>{c.okh} ✓</h3><p>{c.okp}</p></div>
          ) : (
            <form className="c0-form" onSubmit={form.submit}>
              <input placeholder={c.fCafe} value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required />
              <input placeholder={c.fName} value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required />
              <input placeholder={c.fPhone} inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} required />
              <button className="c0-btn lg" disabled={!form.valid || form.loading}>{form.loading ? c.fSending : c.fSend}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="c0-foot">
        <div className="c0-inner c0-footgrid">
          <div className="c0-footbrand">
            <a className="c0-word">Serva</a>
            <p>{c.footTag}</p>
            <span className="c0-made">{c.made}</span>
          </div>
          <div className="c0-footcol"><h4>{c.fProduct}</h4><a>{c.fl.menu}</a><a>{c.fl.kds}</a><a>{c.fl.qr}</a><a>{c.fl.reports}</a></div>
          <div className="c0-footcol"><h4>{c.fCompany}</h4><a>{c.fl.about}</a><a>{c.fl.contact}</a><a>{c.fl.careers}</a></div>
          <div className="c0-footcol"><h4>{c.fLegal}</h4><a>{c.fl.privacy}</a><a>{c.fl.terms}</a></div>
        </div>
        <div className="c0-inner c0-footbar"><span>© {new Date().getFullYear()} Serva</span><span>hello@serva.om</span></div>
      </footer>
    </div>
  );
}

/* ---- high-fidelity product recreations (no emoji) ---- */
function MenuPhone({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const items = [
    { n: ar ? 'لاتيه عماني' : 'Omani Latte', d: ar ? 'حليب، قهوة عربية، هيل' : 'Milk, Arabic coffee, cardamom', p: '2.400', g: 'linear-gradient(150deg,#b98a5e,#6f4a2c)' },
    { n: ar ? 'لاتيه إسباني' : 'Spanish Latte', d: ar ? 'حليب مكثّف، إسبريسو' : 'Condensed milk, espresso', p: '2.600', g: 'linear-gradient(150deg,#cdb08c,#8a6a44)' },
    { n: ar ? 'قهوة باردة' : 'Cold Brew', d: ar ? 'نقع ١٨ ساعة، على الثلج' : '18-hour steep, over ice', p: '2.100', g: 'linear-gradient(150deg,#7d6a52,#3f3526)' },
    { n: ar ? 'شاي كرك' : 'Karak Tea', d: ar ? 'شاي أسود، حليب، زعفران' : 'Black tea, milk, saffron', p: '1.200', g: 'linear-gradient(150deg,#c79a64,#9a6f3c)' },
  ];
  return (
    <div className="c0-phone" dir={ar ? 'rtl' : 'ltr'} aria-hidden>
      <div className="c0-ph-status"><span>9:41</span><span className="c0-ph-dots" /></div>
      <div className="c0-ph-head">
        <div className="c0-ph-mark">N</div>
        <div className="c0-ph-name"><b>{ar ? 'مقهى نجمة' : 'Najma Café'}</b><span>{ar ? 'طاولة ١٢' : 'Table 12'}</span></div>
      </div>
      <div className="c0-ph-tabs"><span className="on">{ar ? 'المشروبات' : 'Drinks'}</span><span>{ar ? 'الحلويات' : 'Desserts'}</span><span>{ar ? 'الفطور' : 'Breakfast'}</span></div>
      <div className="c0-ph-items">
        {items.map((it) => (
          <div className="c0-ph-item" key={it.n}>
            <span className="c0-ph-thumb" style={{ backgroundImage: it.g }} />
            <div className="c0-ph-it"><b>{it.n}</b><span>{it.d}</span></div>
            <span className="c0-ph-price">{it.p}</span>
          </div>
        ))}
      </div>
      <div className="c0-ph-cart"><span>{ar ? 'عرض السلة · صنفان' : 'View cart · 2 items'}</span><b>5.000</b></div>
    </div>
  );
}

function KdsBrowser({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const cols = [
    { t: ar ? 'جديد' : 'New', dot: '#C58A12', orders: [{ no: 'A-1042', w: ar ? 'طاولة ١٢' : 'Table 12', it: ar ? '٢× لاتيه عماني' : '2× Omani Latte', m: '00:45', p: '4.800' }] },
    { t: ar ? 'قيد التحضير' : 'Preparing', dot: '#6B59C7', orders: [{ no: 'A-1040', w: ar ? 'سفري' : 'Takeaway', it: ar ? '١× كرك · ١× كيكة' : '1× Karak · 1× Cake', m: '03:20', p: '3.000' }, { no: 'A-1039', w: ar ? 'طاولة ٤' : 'Table 4', it: ar ? '٤× كيك زعفران' : '4× Saffron Cake', m: '01:50', p: '8.400' }] },
    { t: ar ? 'جاهز' : 'Ready', dot: '#1B8F5A', orders: [{ no: 'A-1041', w: ar ? 'سيارة · ٤٨٢١' : 'Car · 4821', it: ar ? '١× قهوة باردة' : '1× Cold Brew', m: '06:05', p: '2.100' }] },
  ];
  return (
    <div className="c0-browser" dir={ar ? 'rtl' : 'ltr'} aria-hidden>
      <div className="c0-bw-bar"><span className="c0-bw-dots"><i /><i /><i /></span><span className="c0-bw-url">app.serva.om/orders</span></div>
      <div className="c0-bw-body">
        <div className="c0-bw-side"><span className="c0-bw-logo">S</span><span className="c0-bw-i on" /><span className="c0-bw-i" /><span className="c0-bw-i" /><span className="c0-bw-i" /></div>
        <div className="c0-bw-main">
          <div className="c0-bw-head"><b>{ar ? 'شاشة المطبخ' : 'Kitchen display'}</b><span className="c0-bw-live"><i />{ar ? 'مباشر' : 'Live'}</span></div>
          <div className="c0-bw-board">
            {cols.map((col) => (
              <div className="c0-bw-col" key={col.t}>
                <div className="c0-bw-colhd"><i style={{ background: col.dot }} />{col.t}<b>{col.orders.length}</b></div>
                {col.orders.map((o) => (
                  <div className="c0-bw-card" key={o.no} style={{ ['--c' as any]: col.dot }}>
                    <div className="c0-bw-ctop"><b>{o.no}</b><span>{o.m}</span></div>
                    <span className="c0-bw-where">{o.w}</span>
                    <span className="c0-bw-it">{o.it}</span>
                    <div className="c0-bw-foot"><b>{o.p} <small>OMR</small></b></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
