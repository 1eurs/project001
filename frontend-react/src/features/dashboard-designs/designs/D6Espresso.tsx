import { CAFE, KPIS, HOURLY, WEEK, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, omr, smoothLine, smoothArea, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d6.css';

export default function D6Espresso({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const maxWeek = Math.max(...WEEK.map((w) => w.rev));
  const total = CHANNELS.reduce((s, c) => s + c.count, 0);

  return (
    <div className="dz-screen d6">
      <aside className="d6-side">
        <div className="d6-brand">Serva<span>.</span></div>
        <nav>
          {KIT_PAGES.map((p) => (
            <a key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}><span>{PAGE_META[p].icon}</span> {PAGE_META[p].en}</a>
          ))}
        </nav>
        <div className="d6-cafe">
          <div className="d6-cafe-logo">☕</div>
          <div><b>{CAFE.name}</b><span>{CAFE.nameAr} · {CAFE.branch}</span></div>
        </div>
      </aside>

      <main className="d6-main">
        <header className="d6-hd">
          <div>
            <span className="d6-kicker">{CAFE.dateAr} · {CAFE.date}</span>
            <h1>Morning roast, all sorted.</h1>
          </div>
          <span className="d6-live"><i />Open · {KPIS.liveNow} in queue</span>
        </header>

        {page === 'overview' ? (<>
        <div className="d6-toprow">
          <article className="d6-feature">
            <span className="d6-flabel">Revenue today</span>
            <div className="d6-fval">{omr(KPIS.revenue)} <small>OMR</small></div>
            <span className="d6-fdelta">↑ {KPIS.revenueDelta}% vs yesterday · {KPIS.guests} guests served</span>
            <svg className="d6-fchart" viewBox="0 0 460 100" preserveAspectRatio="none">
              <defs><linearGradient id="d6g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9a35f" stopOpacity=".4" /><stop offset="100%" stopColor="#d9a35f" stopOpacity="0" /></linearGradient></defs>
              <path d={smoothArea(rev, 460, 100, 4)} fill="url(#d6g)" />
              <path d={smoothLine(rev, 460, 100, 4)} fill="none" stroke="#e6b574" strokeWidth="2.5" />
            </svg>
          </article>

          <div className="d6-ministats">
            <Stat label="Orders" value={String(KPIS.orders)} sub={`↑ ${KPIS.ordersDelta}%`} />
            <Stat label="Avg. order" value={omr(KPIS.avgOrder)} unit="OMR" sub={`↑ ${KPIS.avgOrderDelta}%`} />
            <Stat label="Avg. prep" value={String(KPIS.prepMins)} unit="min" sub={`${KPIS.prepDelta} min`} />
            <Stat label="Paid" value={`${KPIS.paidRate}`} unit="%" sub="124 / 142" />
          </div>
        </div>

        <div className="d6-cols">
          <section className="d6-card d6-orders">
            <div className="d6-chd"><h2>On the pass</h2><span>{LIVE.length} active</span></div>
            <div className="d6-feed">
              {LIVE.map((o) => (
                <div className="d6-order" key={o.no}>
                  <span className="d6-oi">{TYPE_ICON[o.type]}</span>
                  <div className="d6-ob"><b>{o.no} <em>{o.where}</em></b><span>{o.lines.join(' · ')}</span></div>
                  <div className="d6-oside">
                    <span className="d6-ost" style={{ color: STATUS_COLOR[o.status] }}><i style={{ background: STATUS_COLOR[o.status] }} />{STATUS_LABEL[o.status]}</span>
                    <span className="d6-otot">{omr(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="d6-rightcol">
            <section className="d6-card">
              <div className="d6-chd"><h2>House favourites</h2></div>
              <ol className="d6-menu">
                {TOP_ITEMS.slice(0, 5).map((it) => (
                  <li key={it.name}>
                    <span className="d6-me">{it.emoji}</span>
                    <span className="d6-mn">{it.name}<em>{it.nameAr}</em></span>
                    <span className="d6-dots" />
                    <span className="d6-mq">{it.qty}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="d6-card">
              <div className="d6-chd"><h2>This week</h2><span>OMR</span></div>
              <div className="d6-week">
                {WEEK.map((w) => (
                  <div className="d6-wcol" key={w.d}><div className="d6-wt"><i className={w.today ? 'on' : ''} style={{ height: `${(w.rev / maxWeek) * 100}%` }} /></div><span>{w.dAr}</span></div>
                ))}
              </div>
              <div className="d6-channels">
                {CHANNELS.map((c) => <span key={c.key} className="d6-chip"><i style={{ background: c.color }} />{c.label} {Math.round((c.count / total) * 100)}%</span>)}
              </div>
            </section>
          </aside>
        </div>
        </>) : <KitView page={page} />}
      </main>
    </div>
  );
}

function Stat({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub: string }) {
  return (
    <div className="d6-stat">
      <span className="d6-slabel">{label}</span>
      <div className="d6-sval">{value}{unit && <small>{unit}</small>}</div>
      <span className="d6-ssub">{sub}</span>
    </div>
  );
}
