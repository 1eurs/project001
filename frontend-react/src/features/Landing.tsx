import { Link } from 'react-router-dom';
import { DEMO } from '../lib/demo';
import { LangToggle, useI18n } from '../lib/i18n';
import { ThemeToggle } from '../lib/theme';
import './landing.css';

const T = {
  ar: {
    tag: 'منصّة الطلب عبر QR',
    sub: 'ثلاثة تطبيقات — نفس النظام، واجهة عربية أولاً، API حقيقي.',
    a: 'تطبيق العميل', aD: 'تصفّح القائمة، اطلب من الطاولة، وتتبّع طلبك مباشرة.',
    b: 'لوحة المقهى', bD: 'شاشة المطبخ المباشرة، إدارة الطلبات والقائمة والطاولات.',
    c: 'لوحة المنصّة', cD: 'إدارة المطاعم والاشتراكات على مستوى المنصّة.',
    open: 'فتح', creds: 'بيانات الدخول التجريبية',
  },
  en: {
    tag: 'QR ordering platform',
    sub: 'Three apps — one system, Arabic-first, talking to the real API.',
    a: 'Customer app', aD: 'Browse the menu, order from the table, track live.',
    b: 'Cafe dashboard', bD: 'Live kitchen display, manage orders, menu & tables.',
    c: 'Platform admin', cD: 'Manage restaurants and subscriptions platform-wide.',
    open: 'Open', creds: 'Demo credentials',
  },
};

export default function Landing() {
  const { lang } = useI18n();
  const t = T[lang];
  const customerUrl = `/r/${DEMO.slug}/b/${DEMO.branchId}/t/${DEMO.tableToken}`;

  return (
    <div className="landing">
      <div className="landing-inner fade-in">
        <header className="landing-hd">
          <div className="brandmark">◆</div>
          <div style={{ flex: 1 }}>
            <div className="mono-lbl" style={{ color: 'var(--accent)' }}>CAFEQR</div>
            <h1>{t.tag}</h1>
          </div>
          <ThemeToggle />
          <LangToggle />
        </header>
        <p className="landing-sub">{t.sub}</p>

        <div className="cards">
          <Card to={customerUrl} accent="var(--accent)" icon="🍽" title={t.a} desc={t.aD} cta={t.open} />
          <Card to="/dashboard" accent="var(--blue)" icon="🟢" title={t.b} desc={t.bD} cta={t.open} />
          <Card to="/admin" accent="var(--violet, #B08CFF)" icon="🏪" title={t.c} desc={t.cD} cta={t.open} />
        </div>

        <div className="creds">
          <div className="mono-lbl">{t.creds}</div>
          <div className="creds-grid">
            <span>{t.b}</span><code>{DEMO.ownerEmail} · {DEMO.ownerPassword}</code>
            <span>{t.c}</span><code>{DEMO.adminEmail} · {DEMO.adminPassword}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ to, accent, icon, title, desc, cta }: { to: string; accent: string; icon: string; title: string; desc: string; cta: string }) {
  return (
    <Link to={to} className="lcard" style={{ ['--c' as any]: accent }}>
      <div className="lcard-ic">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="lcard-cta">{cta} →</span>
    </Link>
  );
}
