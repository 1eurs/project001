import { CAFE, KPIS, HOURLY, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, omr, smoothLine, smoothArea, donut, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d5.css';

export default function D5Aurora({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const C = 2 * Math.PI * 50;
  const segs = donut(CHANNELS.map((c) => ({ value: c.count, color: c.color })), C);

  return (
    <div className="dz-screen d5">
      <div className="d5-mesh" aria-hidden />
      <div className="d5-wrap">
        <header className="d5-top glass">
          <div className="d5-brand"><span className="d5-logo">S</span><div><b>Serva.</b><span>{CAFE.name} · {CAFE.branch}</span></div></div>
          <nav className="d5-nav">
            {KIT_PAGES.map((p) => <button key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>{PAGE_META[p].en}</button>)}
          </nav>
          <div className="d5-toptools">
            <span className="d5-live"><i />Live · {KPIS.liveNow} active</span>
            <div className="d5-av">MA</div>
          </div>
        </header>

        {page === 'overview' ? (<>
        <div className="d5-kpis">
          <Kpi label="Revenue today" value={omr(KPIS.revenue)} unit="OMR" delta={KPIS.revenueDelta} grad="g-emerald" />
          <Kpi label="Orders" value={String(KPIS.orders)} delta={KPIS.ordersDelta} grad="g-cyan" />
          <Kpi label="Avg. order" value={omr(KPIS.avgOrder)} unit="OMR" delta={KPIS.avgOrderDelta} grad="g-violet" />
          <Kpi label="Avg. prep" value={String(KPIS.prepMins)} unit="min" delta={KPIS.prepDelta} grad="g-pink" invert />
        </div>

        <div className="d5-grid">
          <section className="d5-card glass d5-chart">
            <div className="d5-hd"><div><span>Revenue flow</span><h3>{omr(KPIS.revenue)} <small>OMR today</small></h3></div><span className="d5-tag">+{KPIS.revenueDelta}%</span></div>
            <svg viewBox="0 0 640 220" preserveAspectRatio="none" className="d5-area">
              <defs>
                <linearGradient id="d5line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34e2a4" /><stop offset="50%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#a855f7" /></linearGradient>
                <linearGradient id="d5fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".28" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0" /></linearGradient>
              </defs>
              <path d={smoothArea(rev, 640, 220, 6)} fill="url(#d5fill)" />
              <path d={smoothLine(rev, 640, 220, 6)} fill="none" stroke="url(#d5line)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="d5-xax">{HOURLY.filter((_, i) => i % 2 === 0).map((h) => <span key={h.h}>{h.h}:00</span>)}</div>
          </section>

          <section className="d5-card glass d5-live">
            <div className="d5-hd"><span>Live queue</span><span className="d5-pill-count">{LIVE.length}</span></div>
            <div className="d5-feed">
              {LIVE.map((o) => (
                <div className="d5-order" key={o.no}>
                  <span className="d5-oi">{TYPE_ICON[o.type]}</span>
                  <div className="d5-om"><b>{o.no}</b><span>{o.where} · {o.lines[0]}</span></div>
                  <div className="d5-os">
                    <span className="d5-dot" style={{ background: STATUS_COLOR[o.status], boxShadow: `0 0 12px ${STATUS_COLOR[o.status]}` }} />
                    <span style={{ color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="d5-card glass d5-mix">
            <div className="d5-hd"><span>Order mix</span></div>
            <div className="d5-donut">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" className="d5-dtrack" />
                {segs.map((s, i) => <circle key={i} cx="60" cy="60" r="50" fill="none" stroke={s.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} transform="rotate(-90 60 60)" style={{ filter: `drop-shadow(0 0 6px ${s.color}99)` }} />)}
                <text x="60" y="57" className="d5-dnum">{KPIS.orders}</text>
                <text x="60" y="73" className="d5-dsub">orders</text>
              </svg>
              <ul>{CHANNELS.map((c, i) => <li key={c.key}><i style={{ background: c.color }} />{c.icon} {c.label}<b>{segs[i].pct}%</b></li>)}</ul>
            </div>
          </section>

          <section className="d5-card glass d5-items">
            <div className="d5-hd"><span>Top sellers</span></div>
            <ul>
              {TOP_ITEMS.slice(0, 5).map((it) => {
                const max = TOP_ITEMS[0].qty;
                return <li key={it.name}><span className="d5-ie">{it.emoji}</span><span className="d5-in">{it.name}</span><span className="d5-ibar"><i style={{ width: `${(it.qty / max) * 100}%` }} /></span><b>{it.qty}</b></li>;
              })}
            </ul>
          </section>
        </div>
        </>) : <KitView page={page} />}
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, delta, grad, invert }: { label: string; value: string; unit?: string; delta: number; grad: string; invert?: boolean }) {
  const good = invert ? delta < 0 : delta > 0;
  return (
    <div className="d5-card glass d5-kpi">
      <span className={'d5-glow ' + grad} aria-hidden />
      <span className="d5-klabel">{label}</span>
      <div className={'d5-kval ' + grad}>{value}{unit && <small>{unit}</small>}</div>
      <span className={'d5-kdelta' + (good ? ' up' : ' down')}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</span>
    </div>
  );
}
