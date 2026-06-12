import { Link } from 'react-router-dom';
import { LangToggle } from '../../../lib/i18n';
import { COPY, useLeadForm, type Lang } from '../content';
import { PhoneMock, QrMotif } from '../bits';
import './l4.css';

export default function L4Bold({ lang, showTools = false }: { lang: Lang; showTools?: boolean }) {
  const c = COPY[lang];
  const form = useLeadForm();
  const home = lang === 'ar'
    ? { links: 'روابط', dashboard: 'لوحة الإدارة', admin: 'لوحة المنصّة', contact: 'تواصل', legal: 'القانوني', privacy: 'الخصوصية', terms: 'الشروط', refund: 'الاسترداد', language: 'اللغة' }
    : { links: 'Links', dashboard: 'Dashboard', admin: 'Platform', contact: 'Contact', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', refund: 'Refunds', language: 'Language' };
  const marquee = [c.sub, c.kicker, c.h1b, c.ctaPrimary, c.foot.made];

  return (
    <div className="lz-screen b4" dir={c.dir}>
      <nav className="b4-nav">
        <div className="b4-brand">SERVA<span>.</span></div>
        <div className="b4-links"><a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#request">{c.nav.request}</a></div>
        {showTools && (
          <div className="b4-tools">
            <Link to="/dashboard" className="b4-signin">{c.nav.signin}</Link>
          </div>
        )}
        {showTools ? <Link to="/signup" className="b4-btn">{c.nav.request}</Link> : <a href="#request" className="b4-btn">{c.nav.request}</a>}
      </nav>

      <header className="b4-hero">
        <div className="b4-hero-l">
          <span className="b4-badge">★ {c.kicker}</span>
          <h1>{c.h1a}<br /><span className="b4-mark">{c.h1b}</span><br />{c.h1c}.</h1>
          <p className="b4-sub">{c.sub}</p>
          <p className="b4-lead">{c.lead}</p>
          <div className="b4-cta">
            {showTools ? <Link to="/signup" className="b4-btn lg">{c.ctaPrimary} →</Link> : <a href="#request" className="b4-btn lg">{c.ctaPrimary} →</a>}
          </div>
        </div>
        <div className="b4-hero-r">
          <div className="b4-scan">
            <div className="b4-frame"><PhoneMock c={c} className="b4-phone" /></div>
            <div className="b4-tent" aria-hidden="true">
              <div className="b4-tent-hd"><b>{c.phone.brand}</b><i>{c.phone.scan}</i></div>
              <div className="b4-tent-qr"><QrMotif size={120} /><span className="b4-beam" /></div>
              <div className="b4-tent-ft">SERVA<span>.</span></div>
            </div>
            <span className="b4-trace" aria-hidden="true"><i /></span>
          </div>
          <span className="b4-sticker s1">{lang === 'ar' ? 'بدون تطبيق' : 'NO APP'}</span>
          <span className="b4-sticker s2">QR ✦</span>
        </div>
      </header>

      <div className="b4-marquee"><div className="b4-mtrack">{[...marquee, ...marquee, ...marquee].map((w, i) => <span key={i}>{w}<i>✦</i></span>)}</div></div>

      <section className="b4-sec" id="how">
        <div className="b4-seclbl">{c.howLbl}</div>
        <div className="b4-steps">
          {c.steps.map((s, i) => (
            <div className="b4-step" key={s.t}><span className="b4-stepn">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      <section className="b4-sec" id="feat">
        <div className="b4-seclbl">{c.featLbl}</div>
        <div className="b4-feats">
          {c.features.map((f) => (
            <div className="b4-feat" key={f.t}><span className="b4-fi">{f.i}</span><h4>{f.t}</h4><p>{f.d}</p></div>
          ))}
        </div>
      </section>

      <section className="b4-sec" id="request">
        <div className="b4-reqcard">
          <div className="b4-reqcopy">
            <div className="b4-seclbl">{c.reqLbl}</div>
            <h2 className="b4-h2">{c.reqH}</h2>
            <p className="b4-lead">{c.reqP}</p>
          </div>
          {showTools ? (
            <div className="b4-signup-card">
              <Link to="/signup" className="b4-btn lg full">{c.ctaPrimary} →</Link>
            </div>
          ) : form.done ? (
            <div className="b4-ok"><div className="b4-okmk">✓</div><h3>{c.form.okh}</h3><p>{c.form.okp}</p></div>
          ) : (
            <form className="b4-form" onSubmit={form.submit}>
              <label><span>{c.form.cafe}</span><input value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required /></label>
              <label><span>{c.form.name}</span><input value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required /></label>
              <label><span>{c.form.phone}</span><input inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
              <label><span>{c.form.city}</span><input value={form.f.city} onChange={(e) => form.set('city', e.target.value)} /></label>
              <label className="full"><span>{c.form.note}</span><textarea rows={2} value={form.f.note} onChange={(e) => form.set('note', e.target.value)} /></label>
              <button className="b4-btn lg full" disabled={!form.valid || form.loading}>{form.loading ? c.form.sending : `${c.ctaPrimary} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className={'b4-foot' + (showTools ? ' home' : '')}>
        {showTools && (
          <div className="b4-footgrid">
            <div className="b4-footbrand">
              <div className="b4-brand">SERVA<span>.</span></div>
              <p>{c.foot.made}</p>
              <div className="b4-footlang">
                <h4>{home.language}</h4>
                <LangToggle />
              </div>
            </div>
            <div>
              <h4>{home.links}</h4>
              <Link to="/signup">{c.ctaPrimary}</Link>
              <Link to="/dashboard">{home.dashboard}</Link>
              <Link to="/admin">{home.admin}</Link>
            </div>
            <div>
              <h4>{home.contact}</h4>
              <a href="mailto:hello@serva.app">hello@serva.app</a>
              <a href="tel:+96890000000">+968 9000 0000</a>
              <Link to="/signup">{c.ctaPrimary}</Link>
            </div>
            <div>
              <h4>{home.legal}</h4>
              <Link to="/privacy">{home.privacy}</Link>
              <Link to="/terms">{home.terms}</Link>
              <Link to="/refund">{home.refund}</Link>
            </div>
          </div>
        )}
        <div className="b4-bignme">SERVA.</div>
        <div className="b4-footbar"><span>© {new Date().getFullYear()} SERVA</span><span>{c.foot.made}</span><span>{c.foot.rights}</span></div>
      </footer>
    </div>
  );
}
