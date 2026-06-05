import { Link } from 'react-router-dom';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { BRAND } from '../../lib/brand';
import { DEMO } from '../../lib/demo';
import './site.css';

const T: Dict = {
  ar: {
    nav_idea: 'الفكرة', nav_how: 'كيف يعمل', nav_demo: 'التجربة',
    kicker: 'منصّة الطلب عبر رمز QR',
    h1a: 'اطلب من', h1b: 'الطاولة', trans: 'Order from the table.',
    lead: 'قائمة رقمية، وشاشة مطبخ مباشرة، ودفعٌ اختياري — لمقاهي عُمان. بدون تطبيق؛ يمسح الزبون الرمز ويطلب من مكانه.',
    cta1: 'جرّب العرض', cta2: 'دخول المقاهي', sl_scan: 'امسح', sl_order: 'اطلب', sl_track: 'تابع',
    m_lbl: 'الفكرة', m1: 'لا تطبيق. لا انتظار.', m2: 'امسح الرمز واطلب.',
    how_lbl: 'كيف يعمل',
    s1t: 'امسح الرمز', s1d: 'رمز QR على الطاولة يفتح القائمة فوراً في المتصفح — دون أي تنزيل.',
    s2t: 'اختر واطلب', s2d: 'سلّة بسيطة بالعربية والإنجليزية، وأسعار بالريال العُماني، وإرسالٌ بضغطة واحدة.',
    s3t: 'تابع لحظياً', s3d: 'حالة الطلب تتحدّث مباشرةً، وتصل إلى المطبخ على شاشة منظّمة.',
    cap_lbl: 'الإمكانات',
    i1t: 'عربي وإنجليزي', i1d: 'واجهة عربية أولاً مع تبديل فوري.',
    i2t: 'شاشة المطبخ', i2d: 'طلبات لحظية مع تنبيه صوتي.',
    i3t: 'إدارة القائمة', i3d: 'أصناف وصور وتوفّر بلمسة.',
    i4t: 'رموز الطاولات', i4d: 'أنشئ واطبع رموز QR.',
    i5t: 'الدفع اختياري', i5d: 'نقد أو بطاقة عند الكاشير.',
    i6t: 'تقارير', i6d: 'مبيعات اليوم وأكثر الأصناف طلباً.',
    cta_big_a: 'جرّبه', cta_big_b: 'الآن',
    foot_demo: 'التجربة', foot_dash: 'لوحة المقهى', foot_admin: 'لوحة المنصّة',
    foot_contact: 'تواصل', foot_privacy: 'الخصوصية', foot_terms: 'الشروط',
    foot_made: 'صُنع لمقاهي عُمان', foot_rights: 'جميع الحقوق محفوظة',
  },
  en: {
    nav_idea: 'Idea', nav_how: 'How', nav_demo: 'Demo',
    kicker: 'QR ordering platform',
    h1a: 'Order from', h1b: 'the table', trans: 'اطلب من الطاولة.',
    lead: 'A digital menu, a live kitchen display, and optional payments — for Omani cafés. No app; the guest scans and orders right from their seat.',
    cta1: 'See the demo', cta2: 'Café sign-in', sl_scan: 'scan', sl_order: 'order', sl_track: 'track',
    m_lbl: 'Idea', m1: 'No app. No waiting.', m2: 'Scan and order.',
    how_lbl: 'How it works',
    s1t: 'Scan the code', s1d: 'The QR on the table opens the menu instantly in the browser — no download.',
    s2t: 'Pick & order', s2d: 'A simple cart in Arabic or English, OMR pricing, and one-tap send.',
    s3t: 'Track live', s3d: 'Order status updates in realtime and lands on an organized kitchen screen.',
    cap_lbl: 'Capabilities',
    i1t: 'Arabic & English', i1d: 'RTL-first with an instant switch.',
    i2t: 'Kitchen display', i2d: 'Realtime orders with a sound cue.',
    i3t: 'Menu management', i3d: 'Items, photos, availability in a tap.',
    i4t: 'Table QR codes', i4d: 'Generate and print QR codes.',
    i5t: 'Payments optional', i5d: 'Cash or card at the counter.',
    i6t: 'Reports', i6d: "Today’s sales and best sellers.",
    cta_big_a: 'Try it', cta_big_b: 'now',
    foot_demo: 'Demo', foot_dash: 'Dashboard', foot_admin: 'Platform',
    foot_contact: 'Contact', foot_privacy: 'Privacy', foot_terms: 'Terms',
    foot_made: 'Made for Omani cafés', foot_rights: 'All rights reserved',
  },
};

const customerUrl = `/r/${DEMO.slug}/b/${DEMO.branchId}/t/${DEMO.tableToken}`;
const N = ['01', '02', '03', '04', '05', '06'];
const TICKER = ['قهوة', 'KARAK', 'لاتيه', 'ORDER', 'مطرح', 'QR', 'إسبريسو', 'SCAN', 'حلوى', 'TABLE', 'كرك', 'MENU'];

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
            <span className="mk">◆</span><span>{BRAND.name}</span>
            {BRAND.working && <span className="ed-wn">{lang === 'ar' ? 'اسم مؤقت' : 'working title'}</span>}
          </div>
          <div className="ed-nav">
            <a href="#idea">{t('nav_idea')}</a>
            <a href="#how">{t('nav_how')}</a>
            <a href="#demo">{t('nav_demo')}</a>
          </div>
          <div className="ed-tools"><ThemeToggle /><LangToggle /></div>
        </div>
      </nav>

      <header className="ed-hero ed-wrap">
        <div className="ed-kicker rv">{t('kicker')}</div>
        <h1 className="ed-h1 rv" style={{ animationDelay: '.06s' }}>{t('h1a')}<br />{t('h1b')}<span className="dot">.</span></h1>
        <div className="ed-trans rv" style={{ animationDelay: '.12s' }}>{t('trans')}</div>
        <p className="ed-lead rv" style={{ animationDelay: '.18s' }}>{t('lead')}</p>
        <div className="ed-actions rv" style={{ animationDelay: '.24s' }}>
          <Link className="ed-link" to={customerUrl}>{t('cta1')} ↗</Link>
          <Link className="ed-link alt" to="/dashboard">{t('cta2')}</Link>
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

      <section className="ed-cta ed-wrap" id="demo">
        <h2>{t('cta_big_a')} {t('cta_big_b')}<span className="dot">.</span></h2>
        <Link className="ed-link" to={customerUrl}>{t('cta1')} ↗</Link>
      </section>

      <footer className="ed-foot ed-wrap">
        <div className="grid">
          <div>
            <div className="ed-mark"><span className="mk">◆</span><span>{BRAND.name}</span></div>
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
            <a href="mailto:hello@cafeqr.app">hello@cafeqr.app</a>
            <a href="tel:+96890000000">+968 9000 0000</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div className="big">{BRAND.name}</div>
        <div className="bar">
          <span className="mono">© {new Date().getFullYear()} {BRAND.name}</span>
          <span>· {t('foot_rights')}</span>
          <span className="sp" />
          <a href="#">{t('foot_privacy')}</a><a href="#">{t('foot_terms')}</a>
          <span>· {t('foot_made')}</span>
        </div>
      </footer>
    </div>
  );
}
