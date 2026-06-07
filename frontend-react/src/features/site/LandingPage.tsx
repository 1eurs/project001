import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { BRAND } from '../../lib/brand';
import { DEMO } from '../../lib/demo';
import './site.css';

const T: Dict = {
  ar: {
    nav_idea: 'الفكرة', nav_how: 'كيف يعمل', nav_demo: 'العرض', nav_req: 'اطلب حسابك', nav_signin: 'دخول', cta_start: 'ابدأ الآن',
    kicker: 'طلبك على بُعد مسحة واحدة.',
    h1a: 'اطلب من', h1b: 'سيارتك', trans: 'Order from your car.',
    sub: 'أو من طاولتك — أينما كنت.',
    lead: 'لعربات الطعام والمقاهي في عُمان. يمسح الزبون الرمز من سيارته، يتصفّح القائمة بالعربية أو الإنجليزية، ويطلب — دون أي تطبيق.',
    cta_req: 'اطلب حسابك', cta_demo: 'شاهد العرض', sl_scan: 'امسح', sl_order: 'اطلب', sl_track: 'استلم',
    m_lbl: 'الفكرة', m1: 'لا تطبيق. لا طابور.', m2: 'امسح الرمز واطلب.',
    how_lbl: 'كيف يعمل',
    s1t: 'امسح الرمز', s1d: 'رمز QR على شبّاك العربة أو الطاولة يفتح القائمة فوراً في المتصفح — دون أي تنزيل.',
    s2t: 'اختر واطلب', s2d: 'سلّة بسيطة بالعربية والإنجليزية، وأسعار بالريال العُماني، وإرسالٌ بضغطة واحدة.',
    s3t: 'استلم طلبك', s3d: 'يصل الطلب إلى نافذة التحضير لحظياً، وتتابع حالته حتى الاستلام.',
    cap_lbl: 'الإمكانات',
    i1t: 'عربي وإنجليزي', i1d: 'واجهة عربية أولاً مع تبديل فوري.',
    i2t: 'شاشة التحضير', i2d: 'طلبات لحظية مع تنبيه صوتي.',
    i3t: 'إدارة القائمة', i3d: 'أصناف وصور وتوفّر بلمسة.',
    i4t: 'رموز QR', i4d: 'للعربة أو لكل طاولة — أنشئ واطبع.',
    i5t: 'الدفع اختياري', i5d: 'نقد أو بطاقة عند الاستلام.',
    i6t: 'تقارير', i6d: 'مبيعات اليوم وأكثر الأصناف.',
    demo_lbl: 'العرض', demo_h: 'شاهده حياً', demo_guest: 'هكذا يراها زبونك', demo_guest_c: 'تجربة الطلب من السيارة', demo_dash: 'لوحة العربة', demo_dash_c: 'شاشة التحضير والإدارة',
    req_lbl: 'اطلب حسابك', req_h: 'ابدأ مع عربتك.', req_p: 'اترك بياناتك ونتواصل معك لتجهيز حسابك أو عرضٍ مباشر.',
    f_cafe: 'اسم العربة / المقهى', f_name: 'اسمك', f_phone: 'رقم الجوال', f_city: 'المدينة', f_note: 'ملاحظة (اختياري)',
    f_send: 'أرسل الطلب', f_sending: 'جارٍ الإرسال…', f_okh: 'وصلنا طلبك ✓', f_okp: 'شكراً لك — سنتواصل معك قريباً.',
    foot_demo: 'العرض', foot_dash: 'لوحة العربة', foot_admin: 'لوحة المنصّة', foot_contact: 'تواصل',
    foot_privacy: 'الخصوصية', foot_terms: 'الشروط', foot_refund: 'الاسترداد', foot_made: 'صُنع لعربات ومقاهي عُمان', foot_rights: 'جميع الحقوق محفوظة',
  },
  en: {
    nav_idea: 'Idea', nav_how: 'How', nav_demo: 'Demo', nav_req: 'Request access', nav_signin: 'Sign in', cta_start: 'Start now',
    kicker: 'Your order, one scan away.',
    h1a: 'Order from', h1b: 'your car', trans: 'اطلب من سيارتك.',
    sub: 'or your table — wherever you are.',
    lead: 'For Omani food trucks & cafés. The guest scans from their car, browses the menu in Arabic or English, and orders — with no app at all.',
    cta_req: 'Request access', cta_demo: 'See the demo', sl_scan: 'scan', sl_order: 'order', sl_track: 'pick up',
    m_lbl: 'Idea', m1: 'No app. No queue.', m2: 'Scan and order.',
    how_lbl: 'How it works',
    s1t: 'Scan the code', s1d: 'A QR on the truck window or table opens the menu instantly in the browser — no download.',
    s2t: 'Pick & order', s2d: 'A simple cart in Arabic or English, OMR pricing, and one-tap send.',
    s3t: 'Pick it up', s3d: 'The order hits the prep window in realtime; the guest tracks it until pickup.',
    cap_lbl: 'Capabilities',
    i1t: 'Arabic & English', i1d: 'RTL-first with an instant switch.',
    i2t: 'Prep display', i2d: 'Realtime orders with a sound cue.',
    i3t: 'Menu management', i3d: 'Items, photos, availability in a tap.',
    i4t: 'QR codes', i4d: 'For the truck or each table — generate & print.',
    i5t: 'Payments optional', i5d: 'Cash or card on pickup.',
    i6t: 'Reports', i6d: "Today’s sales and best sellers.",
    demo_lbl: 'Demo', demo_h: 'See it live', demo_guest: 'What your customer sees', demo_guest_c: 'The order-from-car experience', demo_dash: 'Truck dashboard', demo_dash_c: 'Prep display & management',
    req_lbl: 'Request access', req_h: 'Start with your truck.', req_p: 'Leave your details and we’ll set up your account or a live demo.',
    f_cafe: 'Truck / café name', f_name: 'Your name', f_phone: 'Phone number', f_city: 'City', f_note: 'Note (optional)',
    f_send: 'Send request', f_sending: 'Sending…', f_okh: 'Got your request ✓', f_okp: 'Thank you — we’ll be in touch shortly.',
    foot_demo: 'Demo', foot_dash: 'Truck dashboard', foot_admin: 'Platform', foot_contact: 'Contact',
    foot_privacy: 'Privacy', foot_terms: 'Terms', foot_refund: 'Refunds', foot_made: 'Made for Omani trucks & cafés', foot_rights: 'All rights reserved',
  },
};

const customerUrl = `/r/${DEMO.slug}/b/${DEMO.branchId}/t/${DEMO.tableToken}`;
const N = ['01', '02', '03', '04', '05', '06'];
const TICKER = ['قهوة', 'KARAK', 'لاتيه', 'ORDER', 'سيارتك', 'QR', 'إسبريسو', 'SCAN', 'حلوى', 'PICKUP', 'عربة', 'MENU'];

export default function LandingPage() {
  const { lang } = useI18n();
  const t = useT(T);
  const steps: [string, string][] = [['s1t', 's1d'], ['s2t', 's2d'], ['s3t', 's3d']];
  const caps: [string, string][] = [['i1t', 'i1d'], ['i2t', 'i2d'], ['i3t', 'i3d'], ['i4t', 'i4d'], ['i5t', 'i5d'], ['i6t', 'i6d']];

  return (
    <div className="ed">
      <div className="ed-glyph" aria-hidden>ق</div>

      <nav className="ed-top">
        <div className="ed-wrap row">
          <div className="ed-mark">
            <span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span>
            {BRAND.working && <span className="ed-wn">{lang === 'ar' ? 'اسم مؤقت' : 'working title'}</span>}
          </div>
          <div className="ed-nav">
            <a href="#idea">{t('nav_idea')}</a>
            <a href="#how">{t('nav_how')}</a>
            <a href="#demo">{t('nav_demo')}</a>
            <a href="#request">{t('nav_req')}</a>
          </div>
          <div className="ed-tools">
            <Link className="ed-signin" to="/signup">{t('cta_start')}</Link>
            <Link className="ed-signin" to="/dashboard">{t('nav_signin')}</Link>
            <ThemeToggle /><LangToggle />
          </div>
        </div>
      </nav>

      <header className="ed-hero ed-wrap">
        <div className="ed-kicker rv">{t('kicker')}</div>
        <h1 className="ed-h1 rv" style={{ animationDelay: '.06s' }}>{t('h1a')}<br />{t('h1b')}<span className="dot">.</span></h1>
        <div className="ed-trans rv" style={{ animationDelay: '.12s' }}>{t('trans')} <span className="ed-or">{t('sub')}</span></div>
        <p className="ed-lead rv" style={{ animationDelay: '.18s' }}>{t('lead')}</p>
        <div className="ed-actions rv" style={{ animationDelay: '.24s' }}>
          <Link className="ed-link" to="/signup">{t('cta_start')} ↗</Link>
          <Link className="ed-link alt" to={customerUrl}>{t('cta_demo')}</Link>
        </div>
        <div className="ed-stepline rv" style={{ animationDelay: '.3s' }}>
          <span><b>01</b>{t('sl_scan')}</span><span><b>02</b>{t('sl_order')}</span><span><b>03</b>{t('sl_track')}</span>
        </div>
      </header>

      <div className="ed-ticker"><div className="ed-track">{[...TICKER, ...TICKER].map((w, i) => <span key={i}>{w}</span>)}</div></div>

      <section className="ed-sec ed-wrap" id="idea">
        <div className="ed-lbl"><span className="n">{N[0]}</span>{t('m_lbl')}</div>
        <h2 className="ed-statement">{t('m1')} <span className="hl">{t('m2')}</span></h2>
      </section>

      <section className="ed-sec ed-wrap" id="how">
        <div className="ed-lbl"><span className="n">{N[1]}</span>{t('how_lbl')}</div>
        <div className="ed-steps">
          {steps.map(([tk, dk], i) => (
            <div className="ed-step" key={tk}><div className="num">{N[i]}</div><div><h3>{t(tk)}</h3><p>{t(dk)}</p></div></div>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="cap">
        <div className="ed-lbl"><span className="n">{N[2]}</span>{t('cap_lbl')}</div>
        <div className="ed-rows">
          {caps.map(([tk, dk], i) => (
            <div className="ed-row" key={tk}><span className="rn">{N[i]}</span><div><div className="rt">{t(tk)}</div><div className="rd">{t(dk)}</div></div></div>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="demo">
        <div className="ed-lbl"><span className="n">{N[3]}</span>{t('demo_lbl')}</div>
        <h2 className="ed-statement" style={{ fontSize: 'clamp(28px,4.4vw,56px)' }}>{t('demo_h')}</h2>
        <div className="ed-demo">
          <Link className="ed-demo-card" to={customerUrl}>
            <span className="tag">{t('demo_guest')}</span><span className="cap">{t('demo_guest_c')}</span><span className="go">↗</span>
          </Link>
          <Link className="ed-demo-card" to="/dashboard">
            <span className="tag">{t('demo_dash')}</span><span className="cap">{t('demo_dash_c')}</span><span className="go">↗</span>
          </Link>
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="request">
        <div className="ed-lbl"><span className="n">{N[4]}</span>{t('req_lbl')}</div>
        <h2 className="ed-statement">{t('req_h')}</h2>
        <p className="ed-lead" style={{ marginTop: 14 }}>{t('req_p')}</p>
        <RequestForm t={t} />
      </section>

      <footer className="ed-foot ed-wrap">
        <div className="grid">
          <div>
            <div className="ed-mark"><span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span></div>
            <p className="tag">{BRAND.tagline[lang]}</p>
          </div>
          <div>
            <h4>{t('nav_demo')}</h4>
            <Link to={customerUrl}>{t('foot_demo')}</Link>
            <Link to="/dashboard">{t('foot_dash')}</Link>
            <Link to="/admin">{t('foot_admin')}</Link>
          </div>
          <div>
            <h4>{t('foot_contact')}</h4>
            <a href="mailto:hello@serva.app">hello@serva.app</a>
            <a href="tel:+96890000000">+968 9000 0000</a>
            <a href="#request">{t('cta_req')}</a>
          </div>
        </div>
        <div className="big">{BRAND.name}</div>
        <div className="bar">
          <span className="mono">© {new Date().getFullYear()} {BRAND.name}</span>
          <span>· {t('foot_rights')}</span>
          <span className="sp" />
          <Link to="/privacy">{t('foot_privacy')}</Link><Link to="/terms">{t('foot_terms')}</Link><Link to="/refund">{t('foot_refund')}</Link>
          <span>· {t('foot_made')}</span>
        </div>
      </footer>
    </div>
  );
}

function RequestForm({ t }: { t: (k: string) => string }) {
  const toast = useToast();
  const [f, setF] = useState({ cafeName: '', contactName: '', phone: '', city: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.cafeName.trim() && f.contactName.trim() && f.phone.trim();

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

  if (done) {
    return (
      <div className="ed-ok">
        <div className="ed-ok-mk">✓</div>
        <h3>{t('f_okh')}</h3>
        <p>{t('f_okp')}</p>
      </div>
    );
  }

  return (
    <form className="ed-form" onSubmit={submit}>
      <label className="ef"><span>{t('f_cafe')}</span><input value={f.cafeName} onChange={(e) => set('cafeName', e.target.value)} required /></label>
      <label className="ef"><span>{t('f_name')}</span><input value={f.contactName} onChange={(e) => set('contactName', e.target.value)} required /></label>
      <label className="ef"><span>{t('f_phone')}</span><input className="num" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
      <label className="ef"><span>{t('f_city')}</span><input value={f.city} onChange={(e) => set('city', e.target.value)} /></label>
      <label className="ef ef-full"><span>{t('f_note')}</span><textarea rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} /></label>
      <div className="ed-form-foot">
        <button className="btn" type="submit" disabled={!valid || loading}>{loading ? t('f_sending') : `${t('f_send')} ↗`}</button>
      </div>
    </form>
  );
}
