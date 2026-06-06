import { Link } from 'react-router-dom';
import { COPY, DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock } from '../bits';
import './l2.css';

export default function L2Warmth({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const form = useLeadForm();

  return (
    <div className="lz-screen w2" dir={c.dir}>
      <nav className="w2-nav">
        <div className="w2-brand">Serva<span>.</span></div>
        <div className="w2-links"><a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#demo">{c.nav.demo}</a></div>
        <div className="w2-navcta"><Link to="/dashboard" className="w2-textlink">{c.nav.signin}</Link><a href="#request" className="w2-btn">{c.nav.request}</a></div>
      </nav>

      <header className="w2-hero">
        <div className="w2-hero-l">
          <span className="w2-kicker">{c.kicker}</span>
          <h1>{c.h1a} <em>{c.h1b}</em><br />{c.h1c}<span className="w2-dot">.</span></h1>
          <p className="w2-sub">{c.sub}</p>
          <p className="w2-lead">{c.lead}</p>
          <div className="w2-cta">
            <a href="#request" className="w2-btn lg">{c.ctaPrimary}</a>
            <Link to={DEMO_LINKS.customer} className="w2-btn ghost lg">{c.ctaSecondary} →</Link>
          </div>
        </div>
        <div className="w2-hero-r">
          <div className="w2-blob" />
          <PhoneMock c={c} className="w2-phone" />
        </div>
      </header>

      <div className="w2-strip">
        {c.stats.map((s) => <div key={s.k} className="w2-stripitem"><b>{s.k}</b><span>{s.v}</span></div>)}
      </div>

      <section className="w2-sec" id="how">
        <div className="w2-seclbl">{c.howLbl}</div>
        <div className="w2-steps">
          {c.steps.map((s, i) => (
            <div className="w2-step" key={s.t}><span className="w2-stepn">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      <section className="w2-sec" id="feat">
        <div className="w2-seclbl">{c.featLbl}</div>
        <div className="w2-feats">
          {c.features.map((f) => (
            <div className="w2-feat" key={f.t}><span className="w2-fi">{f.i}</span><div><h4>{f.t}</h4><p>{f.d}</p></div></div>
          ))}
        </div>
      </section>

      <section className="w2-sec w2-demo" id="demo">
        <div className="w2-seclbl">{c.demoLbl}</div>
        <h2 className="w2-h2">{c.demoH}</h2>
        <div className="w2-demos">
          <Link to={DEMO_LINKS.customer} className="w2-democard"><span className="t">{c.demoGuest}</span><span className="cc">{c.demoGuestC}</span><span className="go">↗</span></Link>
          <Link to={DEMO_LINKS.dashboard} className="w2-democard alt"><span className="t">{c.demoDash}</span><span className="cc">{c.demoDashC}</span><span className="go">↗</span></Link>
        </div>
      </section>

      <section className="w2-sec" id="request">
        <div className="w2-reqcard">
          <div className="w2-reqcopy">
            <div className="w2-seclbl">{c.reqLbl}</div>
            <h2 className="w2-h2">{c.reqH}</h2>
            <p className="w2-lead">{c.reqP}</p>
          </div>
          {form.done ? (
            <div className="w2-ok"><div className="w2-okmk">✓</div><h3>{c.form.okh}</h3><p>{c.form.okp}</p></div>
          ) : (
            <form className="w2-form" onSubmit={form.submit}>
              <label><span>{c.form.cafe}</span><input value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required /></label>
              <label><span>{c.form.name}</span><input value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required /></label>
              <label><span>{c.form.phone}</span><input inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
              <label><span>{c.form.city}</span><input value={form.f.city} onChange={(e) => form.set('city', e.target.value)} /></label>
              <label className="full"><span>{c.form.note}</span><textarea rows={2} value={form.f.note} onChange={(e) => form.set('note', e.target.value)} /></label>
              <button className="w2-btn lg full" disabled={!form.valid || form.loading}>{form.loading ? c.form.sending : c.ctaPrimary}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="w2-foot">
        <div className="w2-foot-top"><div className="w2-brand">Serva<span>.</span></div><span>{c.foot.tagline}</span></div>
        <div className="w2-bignme">Serva.</div>
        <div className="w2-footrt">© {new Date().getFullYear()} Serva · {c.foot.made} · {c.foot.rights}</div>
      </footer>
    </div>
  );
}
