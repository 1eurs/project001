import { Link } from 'react-router-dom';
import { COPY, DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock, QrMotif } from '../bits';
import './l5.css';

export default function L5Lumen({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const form = useLeadForm();

  return (
    <div className="lz-screen u5" dir={c.dir}>
      <div className="u5-mesh" aria-hidden />
      <div className="u5-grain" aria-hidden />

      <nav className="u5-nav glass">
        <div className="u5-brand"><span className="u5-mk">S</span>Serva<i>.</i></div>
        <div className="u5-links"><a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#demo">{c.nav.demo}</a></div>
        <div className="u5-navcta"><Link to="/dashboard" className="u5-textlink">{c.nav.signin}</Link><a href="#request" className="u5-btn">{c.nav.request}</a></div>
      </nav>

      <header className="u5-hero">
        <span className="u5-kicker glass"><i />{c.kicker}</span>
        <h1>{c.h1a} <span className="u5-grad">{c.h1b}</span> {c.h1c}<span className="u5-dot">.</span></h1>
        <p className="u5-sub">{c.sub}</p>
        <p className="u5-lead">{c.lead}</p>
        <div className="u5-cta">
          <a href="#request" className="u5-btn lg">{c.ctaPrimary} →</a>
          <Link to={DEMO_LINKS.customer} className="u5-btn ghost lg">{c.ctaSecondary}</Link>
        </div>
        <div className="u5-herophone">
          <PhoneMock c={c} className="u5-phone" />
          <div className="u5-qr glass"><QrMotif size={56} /><span>{c.phone.scan}</span></div>
          <div className="u5-stats glass">
            {c.stats.map((s) => <div key={s.k}><b>{s.k}</b><span>{s.v}</span></div>)}
          </div>
        </div>
      </header>

      <section className="u5-sec" id="how">
        <div className="u5-lbl">{c.howLbl}</div>
        <div className="u5-steps">
          {c.steps.map((s, i) => (
            <div className="u5-step glass" key={s.t}><span className="u5-num">0{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      <section className="u5-sec" id="feat">
        <div className="u5-lbl">{c.featLbl}</div>
        <div className="u5-feats">
          {c.features.map((f) => (
            <div className="u5-feat glass" key={f.t}><span className="u5-fi">{f.i}</span><h4>{f.t}</h4><p>{f.d}</p></div>
          ))}
        </div>
      </section>

      <section className="u5-sec" id="demo">
        <div className="u5-lbl">{c.demoLbl}</div>
        <h2 className="u5-h2">{c.demoH}</h2>
        <div className="u5-demos">
          <Link to={DEMO_LINKS.customer} className="u5-democard glass"><span className="t">{c.demoGuest}</span><span className="cc">{c.demoGuestC}</span><span className="go">↗</span></Link>
          <Link to={DEMO_LINKS.dashboard} className="u5-democard glass alt"><span className="t">{c.demoDash}</span><span className="cc">{c.demoDashC}</span><span className="go">↗</span></Link>
        </div>
      </section>

      <section className="u5-sec" id="request">
        <div className="u5-reqcard glass">
          <div className="u5-reqcopy">
            <div className="u5-lbl">{c.reqLbl}</div>
            <h2 className="u5-h2">{c.reqH}</h2>
            <p className="u5-lead">{c.reqP}</p>
          </div>
          {form.done ? (
            <div className="u5-ok"><div className="u5-okmk">✓</div><h3>{c.form.okh}</h3><p>{c.form.okp}</p></div>
          ) : (
            <form className="u5-form" onSubmit={form.submit}>
              <label><span>{c.form.cafe}</span><input value={form.f.cafeName} onChange={(e) => form.set('cafeName', e.target.value)} required /></label>
              <label><span>{c.form.name}</span><input value={form.f.contactName} onChange={(e) => form.set('contactName', e.target.value)} required /></label>
              <label><span>{c.form.phone}</span><input inputMode="tel" value={form.f.phone} onChange={(e) => form.set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
              <label><span>{c.form.city}</span><input value={form.f.city} onChange={(e) => form.set('city', e.target.value)} /></label>
              <label className="full"><span>{c.form.note}</span><textarea rows={2} value={form.f.note} onChange={(e) => form.set('note', e.target.value)} /></label>
              <button className="u5-btn lg full" disabled={!form.valid || form.loading}>{form.loading ? c.form.sending : `${c.ctaPrimary} →`}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="u5-foot">
        <div className="u5-brand"><span className="u5-mk">S</span>Serva<i>.</i></div>
        <span className="u5-foottag">{c.foot.tagline}</span>
        <span className="u5-footrt">© {new Date().getFullYear()} Serva · {c.foot.made}</span>
      </footer>
    </div>
  );
}
