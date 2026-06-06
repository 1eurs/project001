import { CAFE, KPIS, HOURLY, WEEK, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, omr, smoothLine, smoothArea, donut, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d3.css';

export default function D3Bento({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const maxWeek = Math.max(...WEEK.map((w) => w.rev));
  const C = 2 * Math.PI * 46;
  const segs = donut(CHANNELS.map((c) => ({ value: c.count, color: c.color })), C);

  return (
    <div className="dz-screen d3">
      <header className="d3-top">
        <div className="d3-brand"><span className="d3-logo">S</span> Serva<i>.</i></div>
        <nav className="d3-nav">
          {KIT_PAGES.map((p) => <button key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>{PAGE_META[p].en}</button>)}
        </nav>
        <div className="d3-right"><span className="d3-live"><i />Live · {KPIS.liveNow}</span><div className="d3-av">MA</div></div>
      </header>

      {page === 'overview' ? (
      <div className="d3-bento">
        {/* hero revenue */}
        <div className="d3-tile d3-rev t-emerald">
          <div className="d3-tl-hd"><span>Revenue today</span><span className="d3-chip">↑ {KPIS.revenueDelta}%</span></div>
          <div className="d3-big">{omr(KPIS.revenue)}<small>OMR</small></div>
          <svg className="d3-revchart" viewBox="0 0 380 90" preserveAspectRatio="none">
            <defs><linearGradient id="d3g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0b3b2e" stopOpacity=".9" /><stop offset="100%" stopColor="#0b3b2e" stopOpacity="0" /></linearGradient></defs>
            <path d={smoothArea(rev, 380, 90, 3)} fill="url(#d3g)" />
            <path d={smoothLine(rev, 380, 90, 3)} fill="none" stroke="#06251c" strokeWidth="2.5" />
          </svg>
        </div>

        <div className="d3-tile d3-k t-blue"><span>Orders</span><b>{KPIS.orders}</b><em>↑ {KPIS.ordersDelta}%</em></div>
        <div className="d3-tile d3-k t-violet"><span>Avg order</span><b>{omr(KPIS.avgOrder)}</b><em>OMR</em></div>
        <div className="d3-tile d3-k t-amber"><span>Avg prep</span><b>{KPIS.prepMins}<small>m</small></b><em>{KPIS.prepDelta} min</em></div>
        <div className="d3-tile d3-k t-pink"><span>Guests</span><b>{KPIS.guests}</b><em>↑ {KPIS.guestsDelta}%</em></div>

        {/* live orders */}
        <div className="d3-tile d3-live-tile t-dark">
          <div className="d3-tl-hd light"><span>Live queue</span><span className="d3-count">{LIVE.length}</span></div>
          <div className="d3-feed">
            {LIVE.map((o) => (
              <div className="d3-ord" key={o.no}>
                <span className="d3-oi">{TYPE_ICON[o.type]}</span>
                <div><b>{o.no}</b><span>{o.where}</span></div>
                <span className="d3-ost" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span>
                <span className="d3-om">{o.mins}</span>
              </div>
            ))}
          </div>
        </div>

        {/* channel donut */}
        <div className="d3-tile d3-donut t-cream">
          <div className="d3-tl-hd"><span>Order mix</span></div>
          <div className="d3-donutwrap">
            <svg viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" className="d3-dtrack" />
              {segs.map((s, i) => <circle key={i} cx="55" cy="55" r="46" fill="none" stroke={s.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} transform="rotate(-90 55 55)" />)}
              <text x="55" y="60" className="d3-dtext">{KPIS.orders}</text>
            </svg>
            <ul>{CHANNELS.map((c, i) => <li key={c.key}><i style={{ background: c.color }} />{c.label}<b>{segs[i].pct}%</b></li>)}</ul>
          </div>
        </div>

        {/* top items */}
        <div className="d3-tile d3-items t-cream">
          <div className="d3-tl-hd"><span>Top sellers</span></div>
          <ul>
            {TOP_ITEMS.slice(0, 5).map((it) => {
              const max = TOP_ITEMS[0].qty;
              return <li key={it.name}><span className="d3-ie">{it.emoji}</span><span className="d3-in">{it.name}</span><span className="d3-ibar"><i style={{ width: `${(it.qty / max) * 100}%` }} /></span><b>{it.qty}</b></li>;
            })}
          </ul>
        </div>

        {/* week */}
        <div className="d3-tile d3-week t-night">
          <div className="d3-tl-hd light"><span>This week</span><em>OMR</em></div>
          <div className="d3-wbars">
            {WEEK.map((w) => <div className="d3-wcol" key={w.d}><div className="d3-wtrack"><i className={w.today ? 'on' : ''} style={{ height: `${(w.rev / maxWeek) * 100}%` }} /></div><span>{w.d}</span></div>)}
          </div>
        </div>
      </div>
      ) : <KitView page={page} />}
    </div>
  );
}
