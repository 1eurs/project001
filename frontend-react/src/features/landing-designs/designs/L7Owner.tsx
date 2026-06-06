import { Link } from 'react-router-dom';
import { DEMO_LINKS, useLeadForm, type Lang } from '../content';
import './l7.css';

const C7 = {
  ar: {
    dir: 'rtl' as const, brand: 'Serva.', signin: 'دخول', request: 'احجز عرضاً',
    kicker: 'لأصحاب المقاهي وعربات الطعام',
    h1a: 'حوّل كل طاولة', h1b: 'إلى نقطة بيع.',
    lead: 'كل رمز QR هو كاشير صغير: يطلب الزبون بنفسه، يصل الطلب مكتوباً للمطبخ، وتتابع المبيعات لحظياً من هاتفك.',
    cta1: 'احجز عرضاً', cta2: 'افتح اللوحة',
    metrics: [['+١٨٪', 'متوسط قيمة الطلب عبر اقتراح الإضافات'], ['٠', 'طلبات منسيّة — كل طلب مسجّل'], ['لحظي', 'مبيعات اليوم وأكثر الأصناف على هاتفك']],
    whyL: 'لماذا يتحوّلون إلى Serva',
    why: [['اقتراح ذكي للإضافات', 'القائمة تقترح مشروباً أو حلوى عند الطلب — فاتورة أعلى دون ضغط.'], ['لا طلبات ضائعة', 'كل طلب يصل مكتوباً وواضحاً للمطبخ مع تنبيه صوتي.'], ['طاقم أخف', 'يطلب الزبون بنفسه؛ فريقك يحضّر ويخدم بدل الوقوف على الكاشير.'], ['تقارير حيّة', 'مبيعات اليوم، أكثر الأصناف، وأوقات الذروة — لحظياً.']],
    quote: '«صار الزبون يطلب بنفسه من الطاولة، وقلّت أخطاء الطلبات تقريباً للصفر. فريقي صار يركّز على التحضير.»',
    quoteBy: 'صاحب مقهى — مسقط',
    trust: 'بلا أجهزة · بلا عقود · يعمل على الهاتف لديك',
    reqH: 'احجز عرضاً مباشراً.', reqP: 'نريك Serva على قائمتك أنت خلال ١٥ دقيقة.',
    fCafe: 'اسم المقهى', fName: 'اسمك', fPhone: 'رقم الجوال', fSend: 'احجز العرض', fSending: 'جارٍ الإرسال…', okh: 'تم الحجز ✓', okp: 'سنتواصل معك لتحديد الموعد.',
    foot: 'صُنع لعربات ومقاهي عُمان',
  },
  en: {
    dir: 'ltr' as const, brand: 'Serva.', signin: 'Sign in', request: 'Book a demo',
    kicker: 'For café & food-truck owners',
    h1a: 'Turn every table', h1b: 'into a checkout.',
    lead: 'Every QR code is a tiny till: guests order themselves, the kitchen gets a clean written ticket, and you watch sales live from your phone.',
    cta1: 'Book a demo', cta2: 'Open the dashboard',
    metrics: [['+18%', 'average order value with add-on prompts'], ['0', 'forgotten orders — everything is logged'], ['Live', "today's sales & best sellers on your phone"]],
    whyL: 'Why owners switch to Serva',
    why: [['Smart add-on prompts', 'The menu suggests a drink or dessert at checkout — a higher bill, no pressure.'], ['No missed orders', 'Every order reaches the kitchen written and clear, with a sound cue.'], ['Lighter staffing', 'Guests order themselves; your team preps and serves instead of manning the till.'], ['Live reports', "Today's sales, best sellers, and peak hours — in realtime."]],
    quote: '“Guests now order themselves from the table, and order mistakes dropped to almost zero. My team focuses on prep.”',
    quoteBy: 'Café owner — Muscat',
    trust: 'No hardware · No contracts · Works on the phone you have',
    reqH: 'Book a live demo.', reqP: 'We’ll show you Serva on your own menu in 15 minutes.',
    fCafe: 'Café name', fName: 'Your name', fPhone: 'Phone number', fSend: 'Book demo', fSending: 'Sending…', okh: 'Booked ✓', okp: 'We’ll reach out to schedule.',
    foot: 'Made for Omani trucks & cafés',
  },
};

export default function L7Owner({ lang }: { lang: Lang }) {
  const c = C7[lang];
  const form = useLeadForm();
  const bars = [42, 58, 35, 64, 80, 71, 90];

  return (
    <div className="lz-screen o7" dir={c.dir}>
      <div className="o7-grid-bg" aria-hidden />
      <nav className="o7-nav">
        <div className="o7-brand"><span className="o7-mk">S</span>{c.brand}</div>
        <div className="o7-navr"><Link to="/dashboard" className="o7-textlink">{c.signin}</Link><a href="#request" className="o7-btn">{c.request}</a></div>
      </nav>

      <header className="o7-hero">
        <div className="o7-hero-l">
          <span className="o7-kicker">{c.kicker}</span>
          <h1>{c.h1a}<br /><span className="o7-grad">{c.h1b}</span></h1>
          <p className="o7-lead">{c.lead}</p>
          <div className="o7-cta"><a href="#request" className="o7-btn lg">{c.cta1} →</a><Link to={DEMO_LINKS.dashboard} className="o7-btn ghost lg">{c.cta2}</Link></div>
          <div className="o7-trust">{c.trust}</div>
        </div>
        <div className="o7-hero-r">
          <div className="o7-dash">
            <div className="o7-dash-hd"><span>{lang === 'ar' ? 'مبيعات اليوم' : 'Today’s sales'}</span><span className="o7-live"><i />LIVE</span></div>
            <div className="o7-dash-big">486.250 <small>OMR</small></div>
            <div className="o7-dash-delta">▲ 12.4% {lang === 'ar' ? 'عن أمس' : 'vs yesterday'}</div>
            <div className="o7-dash-bars">{bars.map((b, i) => <span key={i} style={{ height: `${b}%` }} className={i === bars.length - 1 ? 'on' : ''} />)}</div>
            <div className="o7-dash-row"><div><b>142</b><span>{lang === 'ar' ? 'طلب' : 'orders'}</span></div><div><b>3.42</b><span>{lang === 'ar' ? 'متوسط' : 'avg'}</span></div><div><b>7.4m</b><span>{lang === 'ar' ? 'تحضير' : 'prep'}</span></div></div>
          </div>
        </div>
      </header>

      <section className="o7-metrics">
        {c.metrics.map((m) => <div className="o7-metric" key={m[0]}><b>{m[0]}</b><span>{m[1]}</span></div>)}
      </section>

      <section className="o7-why">
        <h2 className="o7-h2">{c.whyL}</h2>
        <div className="o7-whygrid">
          {c.why.map((w) => <div className="o7-card" key={w[0]}><h4>{w[0]}</h4><p>{w[1]}</p></div>)}
        </div>
      </section>

      <section className="o7-quote">
        <blockquote>{c.quote}</blockquote>
        <cite>— {c.quoteBy}</cite>
      </section>

      <section className="o7-req" id="request">
        <div className="o7-reqcard">
          <div><h2>{c.reqH}</h2><p>{c.reqP}</p></div>
          {form.done ? (
            <div className="o7-ok"><b>✓</b><h3>{c.okh}</h3><p>{c.okp}</p></div>
          ) : (
            <form className="o7-form" onSubmit={form.submit}>
              <input placeholder={c.fCafe} value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required />
              <input placeholder={c.fName} value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required />
              <input placeholder={c.fPhone} inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} required />
              <button className="o7-btn lg" disabled={!form.valid || form.loading}>{form.loading ? c.fSending : `${c.fSend} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="o7-foot"><span className="o7-brand"><span className="o7-mk">S</span>{c.brand}</span><span>© {new Date().getFullYear()} · {c.foot}</span></footer>
    </div>
  );
}
