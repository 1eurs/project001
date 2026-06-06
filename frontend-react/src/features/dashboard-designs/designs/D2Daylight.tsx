import { CAFE, KPIS, HOURLY, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, omr, smoothLine, smoothArea, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d2.css';

export default function D2Daylight({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const total = CHANNELS.reduce((s, c) => s + c.count, 0);

  return (
    <div className="dz-screen d2">
      <div className="d2-shell">
        <header className="d2-top">
          <div className="d2-brand">Serva<span>.</span></div>
          <nav className="d2-nav">
            {KIT_PAGES.map((p) => <a key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>{PAGE_META[p].en}</a>)}
          </nav>
          <div className="d2-right">
            <span className="d2-date">{CAFE.date}</span>
            <div className="d2-av">MA</div>
          </div>
        </header>

        {page === 'overview' ? (<>
        <div className="d2-hero">
          <div>
            <span className="d2-eyebrow">Good evening · {CAFE.name}, {CAFE.branch}</span>
            <h1>Today you served <em>{KPIS.guests}</em> guests<br />and made <em className="accent">{omr(KPIS.revenue)}</em> <small>OMR</small>.</h1>
            <div className="d2-herostats">
              <span><b className="up">↑ {KPIS.revenueDelta}%</b> vs yesterday</span>
              <span className="d2-dot" />
              <span>{KPIS.orders} orders</span>
              <span className="d2-dot" />
              <span>{KPIS.prepMins} min avg prep</span>
            </div>
          </div>
          <div className="d2-herochart">
            <svg viewBox="0 0 320 120" preserveAspectRatio="none">
              <defs><linearGradient id="d2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c2613b" stopOpacity=".22" /><stop offset="100%" stopColor="#c2613b" stopOpacity="0" /></linearGradient></defs>
              <path d={smoothArea(rev, 320, 120, 4)} fill="url(#d2g)" />
              <path d={smoothLine(rev, 320, 120, 4)} fill="none" stroke="#c2613b" strokeWidth="2.5" />
            </svg>
            <span className="d2-chartcap">Revenue · 07:00 → 20:00</span>
          </div>
        </div>

        <div className="d2-kpis">
          <Stat label="Orders today" value={String(KPIS.orders)} delta={`+${KPIS.ordersDelta}%`} />
          <Stat label="Average order" value={omr(KPIS.avgOrder)} unit="OMR" delta={`+${KPIS.avgOrderDelta}%`} />
          <Stat label="Avg. prep time" value={`${KPIS.prepMins}`} unit="min" delta={`${KPIS.prepDelta} min`} good />
          <Stat label="Paid on file" value={`${KPIS.paidRate}`} unit="%" delta="124 / 142" muted />
        </div>

        <div className="d2-cols">
          <section className="d2-panel d2-live">
            <div className="d2-phd"><h2>In the kitchen</h2><span className="d2-count">{KPIS.liveNow} active</span></div>
            <div className="d2-orders">
              {LIVE.map((o) => (
                <article className="d2-order" key={o.no}>
                  <div className="d2-oicon">{TYPE_ICON[o.type]}</div>
                  <div className="d2-obody">
                    <div className="d2-orow"><b>{o.no}</b><span className="d2-where">{o.where}</span></div>
                    <p>{o.lines.join(' · ')}</p>
                  </div>
                  <div className="d2-ometa">
                    <span className="d2-pill" style={{ color: STATUS_COLOR[o.status], borderColor: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span>
                    <span className="d2-time">{o.mins}</span>
                    <b className="d2-total">{omr(o.total)}</b>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="d2-side">
            <section className="d2-panel">
              <div className="d2-phd"><h2>Most loved</h2></div>
              <ol className="d2-items">
                {TOP_ITEMS.slice(0, 5).map((it) => (
                  <li key={it.name}>
                    <span className="d2-emoji">{it.emoji}</span>
                    <span className="d2-iname">{it.name}<em>{it.nameAr}</em></span>
                    <span className="d2-iqty">{it.qty}<small>sold</small></span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="d2-panel">
              <div className="d2-phd"><h2>How they order</h2></div>
              <div className="d2-channelbar">
                {CHANNELS.map((c) => <i key={c.key} style={{ width: `${(c.count / total) * 100}%`, background: c.color }} title={c.label} />)}
              </div>
              <ul className="d2-legend">
                {CHANNELS.map((c) => (
                  <li key={c.key}><i style={{ background: c.color }} />{c.icon} {c.label}<b>{Math.round((c.count / total) * 100)}%</b></li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
        </>) : <KitView page={page} />}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, delta, good, muted }: { label: string; value: string; unit?: string; delta: string; good?: boolean; muted?: boolean }) {
  return (
    <div className="d2-stat">
      <span className="d2-statlabel">{label}</span>
      <div className="d2-statval">{value}{unit && <small>{unit}</small>}</div>
      <span className={'d2-statdelta' + (muted ? ' muted' : good ? ' good' : '')}>{delta}</span>
    </div>
  );
}
