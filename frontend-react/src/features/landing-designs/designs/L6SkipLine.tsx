import { Link } from 'react-router-dom';
import { DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock } from '../bits';
import './l6.css';

const C6 = {
  ar: {
    dir: 'rtl' as const, brand: 'Serva.', signin: 'دخول', request: 'اطلب حسابك',
    kicker: 'لا مزيد من الطوابير',
    h1a: 'تجاوز', h1b: 'الطابور.', h1c: 'اطلب من مقعدك.',
    lead: 'الزبون يمسح الرمز ويطلب من مكانه — بينما طاقمك يحضّر بدل أن يقف على الكاشير. أسرع لزبونك، وأخف على فريقك.',
    cta1: 'اطلب حسابك', cta2: 'شاهد العرض',
    statBig: '~٧ دقائق', statSub: 'تُوفَّر لكل طلب وقت الذروة',
    oldT: 'الطريقة القديمة', newT: 'مع Serva',
    old: ['وقوف في طابور طويل', 'أخطاء في الطلب الشفهي', 'كاشير مشغول طوال الوقت', 'زحام عند نافذة الطلب'],
    neu: ['طلب من المقعد بمسحة واحدة', 'طلب مكتوب وواضح دائماً', 'الطاقم يحضّر بدل أن يكتب', 'لا زحام — الكل يطلب من مكانه'],
    how: 'ثلاث خطوات', steps: [['يمسح الزبون الرمز', 'من الطاولة أو السيارة — تفتح القائمة فوراً'], ['يطلب من مكانه', 'سلّة بسيطة، أسعار بالريال، إرسال بضغطة'], ['تحضّرون وتسلّمون', 'يصل الطلب للمطبخ لحظياً مع تنبيه صوتي']],
    reqH: 'جرّبها في عربتك.', reqP: 'اترك بياناتك ونجهّز لك حساباً أو عرضاً مباشراً.',
    fCafe: 'اسم العربة / المقهى', fName: 'اسمك', fPhone: 'رقم الجوال', fSend: 'أرسل الطلب', fSending: 'جارٍ الإرسال…', okh: 'وصلنا طلبك ✓', okp: 'سنتواصل معك قريباً.',
    foot: 'صُنع لعربات ومقاهي عُمان',
  },
  en: {
    dir: 'ltr' as const, brand: 'Serva.', signin: 'Sign in', request: 'Request access',
    kicker: 'No more queues',
    h1a: 'Skip', h1b: 'the line.', h1c: 'Order from your seat.',
    lead: 'Guests scan and order from where they sit — while your team preps instead of manning the till. Faster for them, lighter for you.',
    cta1: 'Request access', cta2: 'See the demo',
    statBig: '~7 min', statSub: 'saved per order at peak',
    oldT: 'The old way', newT: 'With Serva',
    old: ['Standing in a long queue', 'Mistakes from spoken orders', 'The till is always busy', 'Crowding at the counter'],
    neu: ['Order from the seat in one scan', 'Always a clear written order', 'Staff prep instead of taking orders', 'No crowding — everyone orders in place'],
    how: 'Three steps', steps: [['Guest scans the code', 'From the table or car — the menu opens instantly'], ['Orders from their seat', 'Simple cart, OMR pricing, one-tap send'], ['You prep & hand off', 'The order hits the kitchen live with a sound cue']],
    reqH: 'Try it in your truck.', reqP: 'Leave your details and we’ll set up an account or a live demo.',
    fCafe: 'Truck / café name', fName: 'Your name', fPhone: 'Phone number', fSend: 'Send request', fSending: 'Sending…', okh: 'Got it ✓', okp: 'We’ll be in touch shortly.',
    foot: 'Made for Omani trucks & cafés',
  },
};

export default function L6SkipLine({ lang }: { lang: Lang }) {
  const c = C6[lang];
  const form = useLeadForm();
  const pc = { ...{ dir: c.dir }, phone: { brand: lang === 'ar' ? 'مقهى نجمة' : 'Najma Café', scan: lang === 'ar' ? 'امسح للطلب' : 'Scan to order', cat: lang === 'ar' ? 'المشروبات' : 'Drinks', i1: lang === 'ar' ? 'لاتيه عماني' : 'Omani Latte', i1d: lang === 'ar' ? 'حليب، قهوة، هيل' : 'Milk, coffee, cardamom', i2: lang === 'ar' ? 'شاي كرك' : 'Karak Tea', i2d: lang === 'ar' ? 'شاي، حليب، زعفران' : 'Tea, milk, saffron', i3: lang === 'ar' ? 'كيكة تمر' : 'Date Cake', total: '2.40', cart: lang === 'ar' ? 'عرض السلة' : 'View cart' } } as any;

  return (
    <div className="lz-screen s6" dir={c.dir}>
      <nav className="s6-nav">
        <div className="s6-brand">{c.brand}</div>
        <div className="s6-navr"><Link to="/dashboard" className="s6-textlink">{c.signin}</Link><a href="#request" className="s6-btn">{c.request}</a></div>
      </nav>

      <header className="s6-hero">
        <div className="s6-hero-l">
          <span className="s6-kicker">⚡ {c.kicker}</span>
          <h1>{c.h1a} <span className="s6-mark">{c.h1b}</span><br />{c.h1c}</h1>
          <p className="s6-lead">{c.lead}</p>
          <div className="s6-cta"><a href="#request" className="s6-btn lg">{c.cta1} →</a><Link to={DEMO_LINKS.customer} className="s6-btn ghost lg">{c.cta2}</Link></div>
          <div className="s6-stat"><b>{c.statBig}</b><span>{c.statSub}</span></div>
        </div>
        <div className="s6-hero-r"><PhoneMock c={pc} className="s6-phone" /></div>
      </header>

      <section className="s6-compare">
        <div className="s6-col old">
          <h3>✕ {c.oldT}</h3>
          <ul>{c.old.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="s6-vs">→</div>
        <div className="s6-col new">
          <h3>✓ {c.newT}</h3>
          <ul>{c.neu.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </section>

      <section className="s6-how">
        <div className="s6-howlbl">{c.how}</div>
        <div className="s6-steps">
          {c.steps.map((s, i) => <div className="s6-step" key={i}><span>{i + 1}</span><h4>{s[0]}</h4><p>{s[1]}</p></div>)}
        </div>
      </section>

      <section className="s6-req" id="request">
        <div className="s6-reqcard">
          <div><h2>{c.reqH}</h2><p>{c.reqP}</p></div>
          {form.done ? (
            <div className="s6-ok"><b>✓</b><h3>{c.okh}</h3><p>{c.okp}</p></div>
          ) : (
            <form className="s6-form" onSubmit={form.submit}>
              <input placeholder={c.fCafe} value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required />
              <input placeholder={c.fName} value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required />
              <input placeholder={c.fPhone} inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} required />
              <button className="s6-btn lg" disabled={!form.valid || form.loading}>{form.loading ? c.fSending : `${c.fSend} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="s6-foot"><span className="s6-brand">{c.brand}</span><span>© {new Date().getFullYear()} · {c.foot}</span></footer>
    </div>
  );
}
