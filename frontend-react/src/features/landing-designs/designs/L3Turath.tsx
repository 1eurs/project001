import { Link } from 'react-router-dom';
import { COPY, DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock, QrMotif } from '../bits';
import './l3.css';

export default function L3Turath({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const form = useLeadForm();

  return (
    <div className="lz-screen t3" dir={c.dir}>
      <div className="t3-pattern" aria-hidden />

      <nav className="t3-nav">
        <div className="t3-brand"><span className="t3-seal">✦</span>Serva<i>.</i></div>
        <div className="t3-links"><a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#demo">{c.nav.demo}</a></div>
        <div className="t3-navcta"><Link to="/dashboard" className="t3-textlink">{c.nav.signin}</Link><a href="#request" className="t3-btn">{c.nav.request}</a></div>
      </nav>

      <header className="t3-hero">
        <span className="t3-kicker"><span className="t3-rule" />{c.kicker}<span className="t3-rule" /></span>
        <h1>{c.h1a} <span className="t3-gold">{c.h1b}</span> {c.h1c}<span className="t3-dot">.</span></h1>
        <p className="t3-sub">{c.sub}</p>
        <p className="t3-lead">{c.lead}</p>
        <div className="t3-cta">
          <a href="#request" className="t3-btn lg">{c.ctaPrimary}</a>
          <Link to={DEMO_LINKS.customer} className="t3-btn ghost lg">{c.ctaSecondary} →</Link>
        </div>
        <div className="t3-herophone">
          <div className="t3-arch" />
          <PhoneMock c={c} className="t3-phone" />
          <div className="t3-qrtile"><QrMotif size={58} /><span>{c.phone.scan}</span></div>
        </div>
      </header>

      <div className="t3-strip">
        {c.stats.map((s) => <div key={s.k} className="t3-stat"><b>{s.k}</b><span>{s.v}</span></div>)}
      </div>

      <section className="t3-sec" id="how">
        <div className="t3-seclbl"><span className="t3-diamond">◆</span>{c.howLbl}</div>
        <div className="t3-steps">
          {c.steps.map((s, i) => (
            <div className="t3-step" key={s.t}><span className="t3-stepn">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      <section className="t3-sec" id="feat">
        <div className="t3-seclbl"><span className="t3-diamond">◆</span>{c.featLbl}</div>
        <div className="t3-feats">
          {c.features.map((f) => (
            <div className="t3-feat" key={f.t}><span className="t3-fi">{f.i}</span><h4>{f.t}</h4><p>{f.d}</p></div>
          ))}
        </div>
      </section>

      <section className="t3-sec t3-demo" id="demo">
        <div className="t3-seclbl"><span className="t3-diamond">◆</span>{c.demoLbl}</div>
        <h2 className="t3-h2">{c.demoH}</h2>
        <div className="t3-demos">
          <Link to={DEMO_LINKS.customer} className="t3-democard"><span className="t">{c.demoGuest}</span><span className="cc">{c.demoGuestC}</span><span className="go">↗</span></Link>
          <Link to={DEMO_LINKS.dashboard} className="t3-democard"><span className="t">{c.demoDash}</span><span className="cc">{c.demoDashC}</span><span className="go">↗</span></Link>
        </div>
      </section>

      <section className="t3-sec" id="request">
        <div className="t3-reqcard">
          <div className="t3-corner tl" /><div className="t3-corner tr" /><div className="t3-corner bl" /><div className="t3-corner br" />
          <div className="t3-seclbl center"><span className="t3-diamond">◆</span>{c.reqLbl}</div>
          <h2 className="t3-h2 center">{c.reqH}</h2>
          <p className="t3-lead center">{c.reqP}</p>
          {form.done ? (
            <div className="t3-ok"><div className="t3-okmk">✓</div><h3>{c.form.okh}</h3><p>{c.form.okp}</p></div>
          ) : (
            <form className="t3-form" onSubmit={form.submit}>
              <label><span>{c.form.cafe}</span><input value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required /></label>
              <label><span>{c.form.name}</span><input value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required /></label>
              <label><span>{c.form.phone}</span><input inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
              <label><span>{c.form.city}</span><input value={form.f.city} onChange={(e) => form.set('city', e.target.value)} /></label>
              <label className="full"><span>{c.form.note}</span><textarea rows={2} value={form.f.note} onChange={(e) => form.set('note', e.target.value)} /></label>
              <button className="t3-btn lg full" disabled={!form.valid || form.loading}>{form.loading ? c.form.sending : c.ctaPrimary}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="t3-foot">
        <div className="t3-brand"><span className="t3-seal">✦</span>Serva<i>.</i></div>
        <span>{c.foot.tagline}</span>
        <span className="t3-footrt">© {new Date().getFullYear()} · {c.foot.made}</span>
      </footer>
    </div>
  );
}
