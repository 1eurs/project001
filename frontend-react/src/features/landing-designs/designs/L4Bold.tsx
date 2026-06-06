import { Link } from 'react-router-dom';
import { COPY, DEMO_LINKS, useLeadForm, type Lang } from '../content';
import { PhoneMock } from '../bits';
import './l4.css';

export default function L4Bold({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const form = useLeadForm();
  const marquee = [c.sub, c.kicker, c.h1b, c.ctaSecondary, c.foot.made];

  return (
    <div className="lz-screen b4" dir={c.dir}>
      <nav className="b4-nav">
        <div className="b4-brand">SERVA<span>.</span></div>
        <div className="b4-links"><a href="#how">{c.nav.how}</a><a href="#feat">{c.nav.features}</a><a href="#demo">{c.nav.demo}</a></div>
        <a href="#request" className="b4-btn">{c.nav.request}</a>
      </nav>

      <header className="b4-hero">
        <div className="b4-hero-l">
          <span className="b4-badge">★ {c.kicker}</span>
          <h1>{c.h1a}<br /><span className="b4-mark">{c.h1b}</span><br />{c.h1c}.</h1>
          <p className="b4-sub">{c.sub}</p>
          <p className="b4-lead">{c.lead}</p>
          <div className="b4-cta">
            <a href="#request" className="b4-btn lg">{c.ctaPrimary} →</a>
            <Link to={DEMO_LINKS.customer} className="b4-btn alt lg">{c.ctaSecondary}</Link>
          </div>
        </div>
        <div className="b4-hero-r">
          <div className="b4-frame"><PhoneMock c={c} className="b4-phone" /></div>
          <span className="b4-sticker s1">NO APP</span>
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

      <section className="b4-sec" id="demo">
        <div className="b4-seclbl">{c.demoLbl}</div>
        <h2 className="b4-h2">{c.demoH}</h2>
        <div className="b4-demos">
          <Link to={DEMO_LINKS.customer} className="b4-democard"><span className="t">{c.demoGuest}</span><span className="cc">{c.demoGuestC}</span><span className="go">↗</span></Link>
          <Link to={DEMO_LINKS.dashboard} className="b4-democard alt"><span className="t">{c.demoDash}</span><span className="cc">{c.demoDashC}</span><span className="go">↗</span></Link>
        </div>
      </section>

      <section className="b4-sec" id="request">
        <div className="b4-reqcard">
          <div className="b4-reqcopy">
            <div className="b4-seclbl">{c.reqLbl}</div>
            <h2 className="b4-h2">{c.reqH}</h2>
            <p className="b4-lead">{c.reqP}</p>
          </div>
          {form.done ? (
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

      <footer className="b4-foot">
        <div className="b4-bignme">SERVA.</div>
        <div className="b4-footbar"><span>© {new Date().getFullYear()} SERVA</span><span>{c.foot.made}</span><span>{c.foot.rights}</span></div>
      </footer>
    </div>
  );
}
