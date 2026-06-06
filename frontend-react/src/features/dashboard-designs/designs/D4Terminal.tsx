import { CAFE, KPIS, HOURLY, WEEK, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, TYPE_ICON, omr, points, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import './d4.css';

export default function D4Terminal({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const rev = HOURLY.map((h) => h.rev);
  const maxWeek = Math.max(...WEEK.map((w) => w.rev));
  const total = CHANNELS.reduce((s, c) => s + c.count, 0);
  const peak = HOURLY.reduce((a, b) => (b.rev > a.rev ? b : a));

  return (
    <div className="dz-screen d4">
      <div className="d4-ticker">
        <span>SERVA<b>°</b></span><i>/</i>
        <span>{CAFE.name.toUpperCase()} — {CAFE.branch.toUpperCase()}</span><i>/</i>
        <span>{CAFE.date.toUpperCase()}</span><i>/</i>
        <span className="d4-ok">● SYSTEM OK</span><i>/</i>
        <span>{KPIS.liveNow} ORDERS LIVE</span><i>/</i>
        <span>PEAK {peak.h}:00 · {omr(peak.rev)} OMR</span><i>/</i>
        <span className="d4-ok">SYNC 12s AGO</span>
      </div>

      <div className="d4-wrap">
        <header className="d4-hd">
          <h1>OPERATIONS<span>/ {PAGE_META[page].en.toLowerCase()}</span></h1>
          <nav className="d4-nav">
            {KIT_PAGES.map((p) => <button key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>{PAGE_META[p].en}</button>)}
          </nav>
          <div className="d4-clock">14:38:02 GST</div>
        </header>

        {page === 'overview' ? (<>
        <div className="d4-metrics">
          <Metric k="01" label="REVENUE / OMR" value={omr(KPIS.revenue)} delta={`+${KPIS.revenueDelta}%`} up />
          <Metric k="02" label="ORDERS" value={String(KPIS.orders)} delta={`+${KPIS.ordersDelta}%`} up />
          <Metric k="03" label="AVG ORDER / OMR" value={omr(KPIS.avgOrder)} delta={`+${KPIS.avgOrderDelta}%`} up />
          <Metric k="04" label="AVG PREP / MIN" value={String(KPIS.prepMins)} delta={`${KPIS.prepDelta}`} up />
          <Metric k="05" label="PAID RATE" value={`${KPIS.paidRate}%`} delta="124/142" />
        </div>

        <div className="d4-cols">
          <section className="d4-box d4-chartbox">
            <div className="d4-boxhd"><span>FIG.01 — REVENUE BY HOUR</span><span>07:00–20:00 / OMR</span></div>
            <div className="d4-chart">
              <svg viewBox="0 0 620 220" preserveAspectRatio="none">
                {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="0" x2="620" y1={i * 50 + 10} y2={i * 50 + 10} className="d4-gl" />)}
                {HOURLY.map((_, i) => <line key={i} x1={(620 / (HOURLY.length - 1)) * i} x2={(620 / (HOURLY.length - 1)) * i} y1="0" y2="220" className="d4-gl v" />)}
                <polyline points={points(rev, 620, 220, 6)} fill="none" stroke="#e8482b" strokeWidth="2" />
                {rev.map((v, i) => {
                  const x = 6 + ((620 - 12) / (rev.length - 1)) * i;
                  const max = Math.max(...rev), min = Math.min(...rev);
                  const y = 6 + (220 - 12) * (1 - (v - min) / (max - min));
                  return <rect key={i} x={x - 2.5} y={y - 2.5} width="5" height="5" className="d4-node" />;
                })}
              </svg>
              <div className="d4-xax">{HOURLY.map((h) => <span key={h.h}>{h.h}</span>)}</div>
            </div>
          </section>

          <section className="d4-box d4-livebox">
            <div className="d4-boxhd"><span>LIVE QUEUE</span><span className="d4-blink">●REC</span></div>
            <table className="d4-table">
              <thead><tr><th>NO.</th><th>TYPE</th><th>WHERE</th><th className="r">OMR</th><th>STATUS</th><th className="r">T+</th></tr></thead>
              <tbody>
                {LIVE.map((o) => (
                  <tr key={o.no}>
                    <td className="d4-mono">{o.no}</td>
                    <td>{TYPE_ICON[o.type]}</td>
                    <td className="d4-dim">{o.where}</td>
                    <td className="r d4-mono">{omr(o.total)}</td>
                    <td><span className={'d4-st s-' + o.status}>{STATUS_LABEL[o.status].toUpperCase()}</span></td>
                    <td className="r d4-mono d4-dim">{o.mins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="d4-cols3">
          <section className="d4-box">
            <div className="d4-boxhd"><span>TOP SKU</span><span>QTY</span></div>
            <table className="d4-table">
              <tbody>
                {TOP_ITEMS.map((it, i) => (
                  <tr key={it.name}>
                    <td className="d4-dim">{String(i + 1).padStart(2, '0')}</td>
                    <td>{it.name}</td>
                    <td className="r d4-mono">{it.qty}</td>
                    <td className="r d4-mono d4-dim">{omr(it.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="d4-box">
            <div className="d4-boxhd"><span>CHANNEL MIX</span><span>%</span></div>
            <div className="d4-chan">
              {CHANNELS.map((c) => {
                const pct = Math.round((c.count / total) * 100);
                return (
                  <div className="d4-chanrow" key={c.key}>
                    <span className="d4-chanlbl">{c.label.toUpperCase()}</span>
                    <span className="d4-chantrack"><i style={{ width: `${pct}%` }} /></span>
                    <span className="d4-mono d4-chanpct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="d4-box">
            <div className="d4-boxhd"><span>WEEK / OMR</span><span>SAT–FRI</span></div>
            <div className="d4-week">
              {WEEK.map((w) => (
                <div className="d4-wrow" key={w.d}>
                  <span className="d4-wlbl">{w.d.toUpperCase()}</span>
                  <span className="d4-wtrack"><i className={w.today ? 'on' : ''} style={{ width: `${(w.rev / maxWeek) * 100}%` }} /></span>
                  <span className="d4-mono">{omr(w.rev)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        </>) : <KitView page={page} />}
      </div>
    </div>
  );
}

function Metric({ k, label, value, delta, up }: { k: string; label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="d4-metric">
      <span className="d4-mk">{k}</span>
      <span className="d4-ml">{label}</span>
      <b className="d4-mv">{value}</b>
      <span className={'d4-md' + (up ? ' up' : '')}>{delta}</span>
    </div>
  );
}
