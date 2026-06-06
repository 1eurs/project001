import { Link } from 'react-router-dom';
import { COPY, DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock, QrMotif } from '../bits';
import './l1.css';

export default function L1Velocity({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const form = useLeadForm();

  return (
    <div className="lz-screen v1" dir={c.dir}>
      <div className="v1-aurora" aria-hidden />

      <nav className="v1-nav">
        <div className="v1-brand"><span className="v1-mk">S</span>Serva<i>.</i></div>
        <div className="v1-links">
          <a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#demo">{c.nav.demo}</a>
        </div>
        <div className="v1-navcta">
          <Link to="/dashboard" className="v1-ghost">{c.nav.signin}</Link>
          <a href="#request" className="v1-solid">{c.nav.request}</a>
        </div>
      </nav>

      <header className="v1-hero">
        <div className="v1-hero-l">
          <span className="v1-kicker"><i />{c.kicker}</span>
          <h1>{c.h1a} <span className="v1-grad">{c.h1b}</span><br />{c.h1c}<span className="v1-dot">.</span></h1>
          <p className="v1-sub">{c.sub}</p>
          <p className="v1-lead">{c.lead}</p>
          <div className="v1-cta">
            <a href="#request" className="v1-solid lg">{c.ctaPrimary} →</a>
            <Link to={DEMO_LINKS.customer} className="v1-ghost lg">{c.ctaSecondary}</Link>
          </div>
          <div className="v1-stats">
            {c.stats.map((s) => <div key={s.k} className="v1-stat"><b>{s.k}</b><span>{s.v}</span></div>)}
          </div>
        </div>
        <div className="v1-hero-r">
          <div className="v1-phoneglow" />
          <PhoneMock c={c} className="v1-phone" />
          <div className="v1-qrcard"><QrMotif size={66} /><span>{c.phone.scan}</span></div>
        </div>
      </header>

      <section className="v1-sec" id="how">
        <div className="v1-lbl">{c.howLbl}</div>
        <div className="v1-steps">
          {c.steps.map((s, i) => (
            <div className="v1-step" key={s.t}><span className="v1-num">0{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p>
              {i < c.steps.length - 1 && <span className="v1-arrow">→</span>}</div>
          ))}
        </div>
      </section>

      <section className="v1-sec" id="feat">
        <div className="v1-lbl">{c.featLbl}</div>
        <div className="v1-feats">
          {c.features.map((f) => (
            <div className="v1-feat" key={f.t}><span className="v1-ficon">{f.i}</span><h4>{f.t}</h4><p>{f.d}</p></div>
          ))}
        </div>
      </section>

      <section className="v1-sec" id="demo">
        <div className="v1-lbl">{c.demoLbl}</div>
        <h2 className="v1-h2">{c.demoH}</h2>
        <div className="v1-demos">
          <Link to={DEMO_LINKS.customer} className="v1-democard"><span className="t">{c.demoGuest}</span><span className="cc">{c.demoGuestC}</span><span className="go">↗</span></Link>
          <Link to={DEMO_LINKS.dashboard} className="v1-democard alt"><span className="t">{c.demoDash}</span><span className="cc">{c.demoDashC}</span><span className="go">↗</span></Link>
        </div>
      </section>

      <section className="v1-sec v1-req" id="request">
        <div className="v1-reqcard">
          <div className="v1-reqcopy">
            <div className="v1-lbl">{c.reqLbl}</div>
            <h2 className="v1-h2">{c.reqH}</h2>
            <p className="v1-lead">{c.reqP}</p>
          </div>
          {form.done ? (
            <div className="v1-ok"><div className="v1-okmk">✓</div><h3>{c.form.okh}</h3><p>{c.form.okp}</p></div>
          ) : (
            <form className="v1-form" onSubmit={form.submit}>
              <label><span>{c.form.cafe}</span><input value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required /></label>
              <label><span>{c.form.name}</span><input value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required /></label>
              <label><span>{c.form.phone}</span><input inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
              <label><span>{c.form.city}</span><input value={form.f.city} onChange={(e) => form.set('city', e.target.value)} /></label>
              <label className="full"><span>{c.form.note}</span><textarea rows={2} value={form.f.note} onChange={(e) => form.set('note', e.target.value)} /></label>
              <button className="v1-solid lg full" disabled={!form.valid || form.loading}>{form.loading ? c.form.sending : `${c.ctaPrimary} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="v1-foot">
        <div className="v1-brand"><span className="v1-mk">S</span>Serva<i>.</i></div>
        <span className="v1-foottag">{c.foot.tagline}</span>
        <span className="v1-footrt">© {new Date().getFullYear()} Serva · {c.foot.made}</span>
      </footer>
    </div>
  );
}
