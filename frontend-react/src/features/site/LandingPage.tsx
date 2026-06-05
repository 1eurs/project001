import { Link } from 'react-router-dom';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { BRAND } from '../../lib/brand';
import { DEMO } from '../../lib/demo';
import './site.css';

const T: Dict = {
  ar: {
    nav_features: 'المزايا', nav_how: 'كيف يعمل', nav_demo: 'تجربة', nav_signin: 'دخول المقاهي',
    hero_eyebrow: 'منصّة الطلب عبر رمز QR', hero_t1: 'قائمة رقمية لمقهاك،', hero_t2: 'وطلب أسرع من الطاولة',
    hero_cta1: 'جرّب العرض المباشر', hero_cta2: 'دخول المقاهي',
    trust_1: 'عربي / إنجليزي', trust_2: 'تحديث لحظي', trust_3: 'بدون تطبيق', trust_4: 'ريال عُماني',
    pm_table: 'طاولة ٥', pm_c1: 'قهوة', pm_c2: 'حلويات', pm_i1: 'كرك زعفران', pm_i2: 'كورتادو', pm_cart: '٢ أصناف',
    f_eyebrow: 'المزايا', f_h: 'كل ما يحتاجه المقهى', f_lead: 'من مسح الرمز حتى تسليم الطلب — في نظام واحد بسيط.',
    f1t: 'طلب عبر QR', f1d: 'امسح، تصفّح القائمة، واطلب من الطاولة دون أي تطبيق.',
    f2t: 'عربي وإنجليزي', f2d: 'واجهة عربية أولاً (RTL) مع تبديل فوري للّغة.',
    f3t: 'شاشة المطبخ المباشرة', f3d: 'طلبات لحظية مع تنبيه صوتي ولوحة واضحة للطاقم.',
    f4t: 'الدفع اختياري', f4d: 'أغلب الزبائن يدفعون عند الكاشير؛ سجّل نقداً أو بطاقة.',
    f5t: 'إدارة القائمة', f5d: 'أضف الأصناف والصور وبدّل التوفر بلمسة.',
    f6t: 'رموز QR للطاولات', f6d: 'أنشئ واطبع رموز الطاولات جاهزة للصق.',
    h_eyebrow: 'كيف يعمل', h_h: 'ثلاث خطوات للزبون',
    s1t: 'امسح الرمز', s1d: 'من رمز QR الموجود على الطاولة.',
    s2t: 'اختر واطلب', s2d: 'أضف ما يعجبك للسلة وأرسل الطلب.',
    s3t: 'تابع لحظياً', s3d: 'حالة الطلب تتحدّث حتى الاستلام.',
    d_eyebrow: 'تجربة حية', d_h: 'جرّبه الآن', d_lead: 'بيانات تجريبية جاهزة — افتح أي تطبيق من الثلاثة.',
    d1t: 'كعميل', d1d: 'تصفّح القائمة واطلب من طاولة تجريبية.', d1cta: 'افتح القائمة',
    d2t: 'لوحة المقهى', d2d: 'شاشة المطبخ وإدارة القائمة والطاولات.', d2cta: 'دخول',
    d3t: 'لوحة المنصّة', d3d: 'إدارة المطاعم والاشتراكات.', d3cta: 'دخول',
    cta_h: 'جاهز لرقمنة مقهاك؟', cta_p: 'ابدأ بالعرض التجريبي خلال دقيقة.', cta_btn: 'ابدأ الآن',
    foot_made: 'صُنع لمقاهي عُمان', foot_demo: 'تجربة', foot_dash: 'لوحة المقهى', foot_admin: 'المنصّة',
  },
  en: {
    nav_features: 'Features', nav_how: 'How it works', nav_demo: 'Demo', nav_signin: 'Café sign-in',
    hero_eyebrow: 'QR ordering platform', hero_t1: 'A digital menu for your café,', hero_t2: 'and faster orders from the table',
    hero_cta1: 'See the live demo', hero_cta2: 'Café sign-in',
    trust_1: 'Arabic / English', trust_2: 'Realtime', trust_3: 'No app needed', trust_4: 'OMR pricing',
    pm_table: 'Table 5', pm_c1: 'Coffee', pm_c2: 'Sweets', pm_i1: 'Saffron Karak', pm_i2: 'Cortado', pm_cart: '2 items',
    f_eyebrow: 'Features', f_h: 'Everything a café needs', f_lead: 'From the scan to the handover — in one simple system.',
    f1t: 'QR ordering', f1d: 'Scan, browse the menu, and order from the table — no app.',
    f2t: 'Arabic & English', f2d: 'RTL-first interface with an instant language switch.',
    f3t: 'Live kitchen display', f3d: 'Realtime orders with a sound cue and a clear board for staff.',
    f4t: 'Payments optional', f4d: 'Most guests pay at the counter; mark cash or card.',
    f5t: 'Menu management', f5d: 'Add items, photos, and toggle availability in a tap.',
    f6t: 'Table QR codes', f6d: 'Generate and print table codes, ready to stick.',
    h_eyebrow: 'How it works', h_h: 'Three steps for the guest',
    s1t: 'Scan the code', s1d: 'From the QR on your table.',
    s2t: 'Pick & order', s2d: 'Add what you love and send the order.',
    s3t: 'Track live', s3d: 'Status updates until it reaches you.',
    d_eyebrow: 'Live demo', d_h: 'Try it now', d_lead: 'Demo data is ready — open any of the three apps.',
    d1t: 'As a guest', d1d: 'Browse the menu and order from a demo table.', d1cta: 'Open the menu',
    d2t: 'Café dashboard', d2d: 'Kitchen display, menu & table management.', d2cta: 'Sign in',
    d3t: 'Platform admin', d3d: 'Manage restaurants and subscriptions.', d3cta: 'Sign in',
    cta_h: 'Ready to digitize your café?', cta_p: 'Start with the demo in under a minute.', cta_btn: 'Get started',
    foot_made: 'Made for Omani cafés', foot_demo: 'Demo', foot_dash: 'Dashboard', foot_admin: 'Platform',
  },
};

const customerUrl = `/r/${DEMO.slug}/b/${DEMO.branchId}/t/${DEMO.tableToken}`;

export default function LandingPage() {
  const { lang } = useI18n();
  const t = useT(T);

  return (
    <div className="site">
      {/* NAV */}
      <nav className="snav">
        <div className="wrap row">
          <div className="brand">
            <span className="mk">◆</span>
            <span>{BRAND.name}</span>
            {BRAND.working && <span className="wn">{lang === 'ar' ? 'اسم مؤقت' : 'working title'}</span>}
          </div>
          <div className="links">
            <a href="#features">{t('nav_features')}</a>
            <a href="#how">{t('nav_how')}</a>
            <a href="#demo">{t('nav_demo')}</a>
          </div>
          <div className="sp" />
          <div className="tools">
            <ThemeToggle />
            <LangToggle />
            <Link className="btn sm" to="/dashboard">{t('nav_signin')}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap row">
          <div>
            <span className="eyebrow rv" style={{ animationDelay: '0ms' }}><span className="dot" />{t('hero_eyebrow')}</span>
            <h1 className="rv" style={{ animationDelay: '80ms' }}>{t('hero_t1')} <span className="hl">{t('hero_t2')}</span></h1>
            <p className="lead rv" style={{ animationDelay: '160ms' }}>{BRAND.tagline[lang]}</p>
            <div className="cta rv" style={{ animationDelay: '240ms' }}>
              <Link className="btn" to={customerUrl}>{t('hero_cta1')} →</Link>
              <Link className="btn ghost" to="/dashboard">{t('hero_cta2')}</Link>
            </div>
            <div className="trust rv" style={{ animationDelay: '320ms' }}>
              <span>✦ <b>{t('trust_1')}</b></span><span>✦ <b>{t('trust_2')}</b></span>
              <span>✦ <b>{t('trust_3')}</b></span><span>✦ <b>{t('trust_4')}</b></span>
            </div>
          </div>
          <div className="pmwrap rv" style={{ animationDelay: '200ms' }}>
            <PhoneMock t={t} />
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="section wrap" id="features">
        <span className="eyebrow"><span className="dot" />{t('f_eyebrow')}</span>
        <h2 className="h2">{t('f_h')}</h2>
        <p className="lead2">{t('f_lead')}</p>
        <div className="fgrid">
          {[['🔳', 'f1'], ['🌐', 'f2'], ['🍳', 'f3'], ['💳', 'f4'], ['📋', 'f5'], ['🪑', 'f6']].map(([ic, k]) => (
            <div className="fcard" key={k}><div className="ic">{ic}</div><h3>{t(k + 't')}</h3><p>{t(k + 'd')}</p></div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="section wrap" id="how">
        <span className="eyebrow"><span className="dot" />{t('h_eyebrow')}</span>
        <h2 className="h2">{t('h_h')}</h2>
        <div className="steps">
          {['s1', 's2', 's3'].map((k, i) => (
            <div className="step" key={k}><span className="n">{i + 1}</span><h3>{t(k + 't')}</h3><p>{t(k + 'd')}</p></div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="section wrap" id="demo">
        <span className="eyebrow"><span className="dot" />{t('d_eyebrow')}</span>
        <h2 className="h2">{t('d_h')}</h2>
        <p className="lead2">{t('d_lead')}</p>
        <div className="demo">
          <DemoCard c="var(--accent)" ic="🍽" to={customerUrl} title={t('d1t')} desc={t('d1d')} cta={t('d1cta')} />
          <DemoCard c="var(--blue)" ic="🍳" to="/dashboard" title={t('d2t')} desc={t('d2d')} cta={t('d2cta')} code={`${DEMO.ownerEmail} · ${DEMO.ownerPassword}`} />
          <DemoCard c="var(--violet)" ic="🏪" to="/admin" title={t('d3t')} desc={t('d3d')} cta={t('d3cta')} code={`${DEMO.adminEmail} · ${DEMO.adminPassword}`} />
        </div>
      </section>

      {/* CTA */}
      <section className="section wrap">
        <div className="ctaband">
          <h2>{t('cta_h')}</h2>
          <p>{t('cta_p')}</p>
          <Link className="btn" to={customerUrl}>{t('cta_btn')} →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="wrap row">
          <div className="brand"><span className="mk">◆</span><span>{BRAND.name}</span></div>
          <span style={{ color: 'var(--faint)' }}>· {t('foot_made')}</span>
          <div className="sp" />
          <Link to={customerUrl}>{t('foot_demo')}</Link>
          <Link to="/dashboard">{t('foot_dash')}</Link>
          <Link to="/admin">{t('foot_admin')}</Link>
        </div>
      </footer>
    </div>
  );
}

function DemoCard({ c, ic, to, title, desc, cta, code }: { c: string; ic: string; to: string; title: string; desc: string; cta: string; code?: string }) {
  return (
    <Link to={to} className="dcard" style={{ ['--c' as any]: c }}>
      <div className="ic">{ic}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {code && <code>{code}</code>}
      <span className="go">{cta} →</span>
    </Link>
  );
}

function PhoneMock({ t }: { t: (k: string) => string }) {
  return (
    <div className="pm">
      <div className="pm-hd"><div className="nm">قهوة مطرح</div><div className="tb">🪑 {t('pm_table')}</div></div>
      <div className="pm-cat"><span className="on">{t('pm_c1')}</span><span>{t('pm_c2')}</span><span>Espresso</span></div>
      <div className="pm-it">
        <div className="pm-th" style={{ background: 'linear-gradient(155deg,hsl(28 42% 34%) -30%,#15171C 70%)' }} />
        <div><div className="nm">{t('pm_i1')}</div><div className="pr">0.500 ر.ع</div></div>
        <div className="pm-add">+</div>
      </div>
      <div className="pm-it">
        <div className="pm-th" style={{ background: 'linear-gradient(155deg,hsl(180 30% 34%) -30%,#15171C 70%)' }} />
        <div><div className="nm">{t('pm_i2')}</div><div className="pr">1.300 ر.ع</div></div>
        <div className="pm-add">+</div>
      </div>
      <div className="pm-bar"><span className="ic">🛒</span><span style={{ fontSize: 12 }}>{t('pm_cart')}</span><span className="t">1.875</span></div>
    </div>
  );
}
