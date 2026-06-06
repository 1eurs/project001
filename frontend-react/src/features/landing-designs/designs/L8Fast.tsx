import { Link } from 'react-router-dom';
import { DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock, QrMotif } from '../bits';
import './l8.css';

const C8 = {
  ar: {
    dir: 'rtl' as const, brand: 'Serva.', signin: 'دخول', request: 'ابدأ مجاناً',
    kicker: '⏱ جاهز بسرعة',
    h1a: 'قائمتك مباشرة', h1b: 'في دقيقتين.',
    lead: 'بلا تطبيق، بلا أجهزة، بلا عقد. أضف أصنافك، اطبع رمز QR، وابدأ باستقبال الطلبات — من الهاتف الذي بين يديك.',
    cta1: 'ابدأ مجاناً', cta2: 'شاهد العرض',
    chips: ['بلا تطبيق', 'بلا أجهزة', 'بلا عقد', 'عربي وإنجليزي'],
    setupL: 'الإعداد بأربع خطوات',
    steps: [['أنشئ حسابك', 'بريد ورقم جوال، وانطلق.'], ['أضف أصنافك', 'اسم، سعر، صورة — بلمسة.'], ['اطبع رمز QR', 'للطاولة أو للسيارة.'], ['استقبل الطلبات', 'تصل فوراً لشاشة المطبخ.']],
    bottomH: 'يعمل على الهاتف الذي لديك.',
    bottomP: 'لا حاجة لجهاز كاشير ولا طابعة خاصة. أي هاتف أو جهاز لوحي يكفي.',
    reqH: 'جرّبها الآن.', reqP: 'اترك بياناتك ونجهّز حسابك خلال يوم عمل.',
    fCafe: 'اسم العربة / المقهى', fName: 'اسمك', fPhone: 'رقم الجوال', fSend: 'ابدأ', fSending: 'جارٍ الإرسال…', okh: 'وصلنا طلبك ✓', okp: 'سنجهّز حسابك ونتواصل معك.',
    foot: 'صُنع لعربات ومقاهي عُمان',
  },
  en: {
    dir: 'ltr' as const, brand: 'Serva.', signin: 'Sign in', request: 'Start free',
    kicker: '⏱ Ready fast',
    h1a: 'Your menu live', h1b: 'in 2 minutes.',
    lead: 'No app, no hardware, no contract. Add your items, print a QR, and start taking orders — from the phone already in your hand.',
    cta1: 'Start free', cta2: 'See the demo',
    chips: ['No app', 'No hardware', 'No contract', 'Arabic & English'],
    setupL: 'Set up in four steps',
    steps: [['Create your account', 'Email and a phone number — go.'], ['Add your items', 'Name, price, photo — in a tap.'], ['Print your QR', 'For the table or the car.'], ['Take orders', 'They hit the kitchen screen instantly.']],
    bottomH: 'Works on the phone you already have.',
    bottomP: 'No till machine, no special printer. Any phone or tablet will do.',
    reqH: 'Try it now.', reqP: 'Leave your details and we’ll set you up within a business day.',
    fCafe: 'Truck / café name', fName: 'Your name', fPhone: 'Phone number', fSend: 'Start', fSending: 'Sending…', okh: 'Got it ✓', okp: 'We’ll set up your account and reach out.',
    foot: 'Made for Omani trucks & cafés',
  },
};

export default function L8Fast({ lang }: { lang: Lang }) {
  const c = C8[lang];
  const form = useLeadForm();
  const pc = { dir: c.dir, phone: { brand: lang === 'ar' ? 'مقهى نجمة' : 'Najma Café', scan: lang === 'ar' ? 'امسح للطلب' : 'Scan to order', cat: lang === 'ar' ? 'المشروبات' : 'Drinks', i1: lang === 'ar' ? 'لاتيه عماني' : 'Omani Latte', i1d: lang === 'ar' ? 'حليب، قهوة، هيل' : 'Milk, coffee, cardamom', i2: lang === 'ar' ? 'شاي كرك' : 'Karak Tea', i2d: lang === 'ar' ? 'شاي، حليب، زعفران' : 'Tea, milk, saffron', i3: lang === 'ar' ? 'كيكة تمر' : 'Date Cake', total: '2.40', cart: lang === 'ar' ? 'عرض السلة' : 'View cart' } } as any;

  return (
    <div className="lz-screen f8" dir={c.dir}>
      <div className="f8-blob b1" aria-hidden /><div className="f8-blob b2" aria-hidden />
      <nav className="f8-nav">
        <div className="f8-brand">{c.brand}</div>
        <div className="f8-navr"><Link to="/dashboard" className="f8-textlink">{c.signin}</Link><a href="#request" className="f8-btn">{c.request}</a></div>
      </nav>

      <header className="f8-hero">
        <div className="f8-hero-l">
          <span className="f8-kicker">{c.kicker}</span>
          <h1>{c.h1a}<br /><span className="f8-mark">{c.h1b}</span></h1>
          <p className="f8-lead">{c.lead}</p>
          <div className="f8-cta"><a href="#request" className="f8-btn lg">{c.cta1} →</a><Link to={DEMO_LINKS.customer} className="f8-btn ghost lg">{c.cta2}</Link></div>
          <div className="f8-chips">{c.chips.map((x) => <span key={x}>✓ {x}</span>)}</div>
        </div>
        <div className="f8-hero-r">
          <PhoneMock c={pc} className="f8-phone" />
          <div className="f8-qrsticker"><QrMotif size={50} /><b>QR</b></div>
        </div>
      </header>

      <section className="f8-setup">
        <div className="f8-setuplbl">{c.setupL}</div>
        <div className="f8-steps">
          {c.steps.map((s, i) => (
            <div className="f8-step" key={i}>
              <span className="f8-stepn">{i + 1}</span>
              <h4>{s[0]}</h4><p>{s[1]}</p>
              {i < c.steps.length - 1 && <span className="f8-conn" aria-hidden />}
            </div>
          ))}
        </div>
      </section>

      <section className="f8-bottom">
        <div className="f8-bottomcard">
          <div className="f8-phoneicon">📱</div>
          <div><h2>{c.bottomH}</h2><p>{c.bottomP}</p></div>
        </div>
      </section>

      <section className="f8-req" id="request">
        <div className="f8-reqcard">
          <div><h2>{c.reqH}</h2><p>{c.reqP}</p></div>
          {form.done ? (
            <div className="f8-ok"><b>✓</b><h3>{c.okh}</h3><p>{c.okp}</p></div>
          ) : (
            <form className="f8-form" onSubmit={form.submit}>
              <input placeholder={c.fCafe} value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required />
              <input placeholder={c.fName} value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required />
              <input placeholder={c.fPhone} inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} required />
              <button className="f8-btn lg" disabled={!form.valid || form.loading}>{form.loading ? c.fSending : `${c.fSend} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="f8-foot"><span className="f8-brand">{c.brand}</span><span>© {new Date().getFullYear()} · {c.foot}</span></footer>
    </div>
  );
}
