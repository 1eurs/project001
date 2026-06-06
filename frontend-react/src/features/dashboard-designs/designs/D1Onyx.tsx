import { CAFE, KPIS, HOURLY, WEEK, TOP_ITEMS, CHANNELS, LIVE, STATUS_COLOR, STATUS_LABEL, TYPE_ICON, omr, smoothLine, smoothArea, donut, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d1.css';

const spark = (key: 'rev' | 'orders') => HOURLY.slice(-9).map((h) => h[key]);

export default function D1Onyx({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const maxWeek = Math.max(...WEEK.map((w) => w.rev));
  const C = 2 * Math.PI * 52;
  const segs = donut(CHANNELS.map((c) => ({ value: c.count, color: c.color })), C);

  return (
    <div className="dz-screen d1">
      <aside className="d1-rail">
        <div className="d1-logo">S</div>
        <nav>
          {KIT_PAGES.map((p) => (
            <button key={p} className={page === p ? 'on' : ''} title={PAGE_META[p].en} onClick={() => setPage(p)}>{PAGE_META[p].icon}</button>
          ))}
        </nav>
        <button className="d1-out" title="Settings">⚙</button>
      </aside>

      <main className="d1-main">
        <header className="d1-top">
          <div className="d1-brand">
            <span className="d1-mark">Serva<i>.</i></span>
            <span className="d1-sep" />
            <div>
              <b>{CAFE.name}</b>
              <span>{CAFE.branch} · {CAFE.date}</span>
            </div>
          </div>
          <div className="d1-tools">
            <span className="d1-live"><i />Live</span>
            <select className="d1-select" defaultValue={CAFE.branch}>{CAFE.branches.map((b) => <option key={b}>{b}</option>)}</select>
            <div className="d1-av">MA</div>
          </div>
        </header>

        <section className="d1-body">
          {page === 'overview' ? (<>
          <div className="d1-kpis">
            <Kpi label="Revenue today" value={`${omr(KPIS.revenue)}`} unit="OMR" delta={KPIS.revenueDelta} data={spark('rev')} accent="#10b981" />
            <Kpi label="Orders" value={String(KPIS.orders)} delta={KPIS.ordersDelta} data={spark('orders')} accent="#5AA9FF" />
            <Kpi label="Avg. order" value={omr(KPIS.avgOrder)} unit="OMR" delta={KPIS.avgOrderDelta} data={spark('rev').map((v) => v / 3)} accent="#B08CFF" />
            <Kpi label="Avg. prep" value={String(KPIS.prepMins)} unit="min" delta={KPIS.prepDelta} invert data={[9, 8.4, 8.1, 7.9, 7.6, 7.5, 7.4]} accent="#F5B83D" />
          </div>

          <div className="d1-grid">
            <article className="d1-card d1-chart">
              <div className="d1-card-hd">
                <div><span className="d1-k">Revenue · today</span><h3>{omr(KPIS.revenue)} <small>OMR</small></h3></div>
                <div className="d1-segctl"><button className="on">Hour</button><button>Day</button><button>Week</button></div>
              </div>
              <div className="d1-chart-wrap">
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="d1-area">
                  <defs>
                    <linearGradient id="d1g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="600" y1={i * 50 + 12} y2={i * 50 + 12} className="d1-grid-line" />)}
                  <path d={smoothArea(rev, 600, 200, 6)} fill="url(#d1g)" />
                  <path d={smoothLine(rev, 600, 200, 6)} className="d1-line" />
                </svg>
                <div className="d1-xaxis">{HOURLY.filter((_, i) => i % 2 === 0).map((h) => <span key={h.h}>{h.h}</span>)}</div>
              </div>
            </article>

            <article className="d1-card d1-live-card">
              <div className="d1-card-hd"><span className="d1-k">Live queue</span><span className="d1-badge">{KPIS.liveNow} active</span></div>
              <div className="d1-feed">
                {LIVE.map((o) => (
                  <div className="d1-order" key={o.no}>
                    <span className="d1-otype">{TYPE_ICON[o.type]}</span>
                    <div className="d1-omain">
                      <b>{o.no}<em>{o.where}</em></b>
                      <span>{o.lines.join(' · ')}</span>
                    </div>
                    <div className="d1-oside">
                      <span className="d1-ostatus" style={{ color: STATUS_COLOR[o.status] }}><i style={{ background: STATUS_COLOR[o.status] }} />{STATUS_LABEL[o.status]}</span>
                      <span className="d1-omins">{o.mins}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="d1-card d1-items">
              <div className="d1-card-hd"><span className="d1-k">Top sellers</span><span className="d1-muted">142 orders</span></div>
              <ul>
                {TOP_ITEMS.map((it, i) => {
                  const max = TOP_ITEMS[0].qty;
                  return (
                    <li key={it.name}>
                      <span className="d1-rank">{i + 1}</span>
                      <span className="d1-iname">{it.emoji} {it.name}</span>
                      <span className="d1-bar"><i style={{ width: `${(it.qty / max) * 100}%` }} /></span>
                      <span className="d1-iqty">{it.qty}</span>
                    </li>
                  );
                })}
              </ul>
            </article>

            <article className="d1-card d1-channels">
              <div className="d1-card-hd"><span className="d1-k">Order mix</span></div>
              <div className="d1-donut">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" className="d1-track" />
                  {segs.map((s, i) => (
                    <circle key={i} cx="60" cy="60" r="52" fill="none" stroke={s.color} strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} transform="rotate(-90 60 60)" />
                  ))}
                  <text x="60" y="56" className="d1-dn">{KPIS.orders}</text>
                  <text x="60" y="72" className="d1-dl">orders</text>
                </svg>
                <ul>
                  {CHANNELS.map((c, i) => (
                    <li key={c.key}><i style={{ background: c.color }} />{c.icon} {c.label}<b>{segs[i].pct}%</b></li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="d1-card d1-week">
              <div className="d1-card-hd"><span className="d1-k">This week</span><span className="d1-muted">OMR</span></div>
              <div className="d1-bars">
                {WEEK.map((w) => (
                  <div className="d1-bcol" key={w.d}>
                    <div className="d1-btrack"><i className={w.today ? 'today' : ''} style={{ height: `${(w.rev / maxWeek) * 100}%` }} /></div>
                    <span>{w.d}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
          </>) : <KitView page={page} />}
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, unit, delta, data, accent, invert }: { label: string; value: string; unit?: string; delta: number; data: number[]; accent: string; invert?: boolean }) {
  const good = invert ? delta < 0 : delta > 0;
  return (
    <div className="d1-kpi" style={{ ['--a' as any]: accent }}>
      <span className="d1-k">{label}</span>
      <div className="d1-kval">{value}{unit && <small>{unit}</small>}</div>
      <div className="d1-krow">
        <span className={'d1-delta ' + (good ? 'up' : 'down')}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%</span>
        <svg viewBox="0 0 90 28" className="d1-spark" preserveAspectRatio="none">
          <path d={smoothLine(data, 90, 28, 3)} fill="none" stroke={accent} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
