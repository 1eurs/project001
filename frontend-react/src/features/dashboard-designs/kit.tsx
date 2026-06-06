// ============================================================================
// Shared "dashboard kit" — the Live / Orders / Menu / Tables pages, rendered
// with generic .dk-* classes that each design themes through CSS variables
// (--dk-bg, --dk-panel, --dk-line, --dk-text, --dk-muted, --dk-accent, …).
// This lets all six concepts cover every dashboard page without re-building
// each screen six times. Each concept keeps its own bespoke Overview.
// ============================================================================
import {
  LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, ORDERS_HISTORY, HIST_COLOR,
  MENU, TABLES, TOP_ITEMS, omr, type KitPage as KitPageName,
} from './data';
import './kit.css';

const COLS: { st: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY'; label: string }[] = [
  { st: 'PENDING', label: 'New' }, { st: 'ACCEPTED', label: 'Accepted' },
  { st: 'PREPARING', label: 'Preparing' }, { st: 'READY', label: 'Ready' },
];

function KitQr({ size = 76 }: { size?: number }) {
  const N = 11;
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const finder = (r < 3 && c < 3) || (r < 3 && c >= N - 3) || (r >= N - 3 && c < 3);
    if (finder || (r * 5 + c * 7) % 3 === 0) cells.push(<rect key={`${r}-${c}`} x={c * (size / N)} y={r * (size / N)} width={size / N + 0.4} height={size / N + 0.4} />);
  }
  return <svg className="dk-qr" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>{cells}</svg>;
}

export function KitPage({ page }: { page: KitPageName }) {
  if (page === 'live') return <KitLive />;
  if (page === 'orders') return <KitOrders />;
  if (page === 'menu') return <KitMenu />;
  if (page === 'tables') return <KitTables />;
  return null;
}

function KitLive() {
  return (
    <div className="dk">
      <div className="dk-head">
        <div><h2>Live orders</h2><span className="dk-sub">Kitchen display · realtime</span></div>
        <span className="dk-live"><i />Live · {LIVE.length}</span>
      </div>
      <div className="dk-board">
        {COLS.map((col) => {
          const list = LIVE.filter((o) => o.status === col.st);
          return (
            <div className="dk-col" key={col.st}>
              <div className="dk-colhead"><span className="dk-dot" style={{ background: STATUS_COLOR[col.st] }} />{col.label}<b>{list.length}</b></div>
              <div className="dk-colbody">
                {list.length === 0 ? <div className="dk-empty">No orders</div> : list.map((o) => (
                  <div className="dk-ocard" key={o.no} style={{ ['--c' as any]: STATUS_COLOR[o.status] }}>
                    <div className="dk-ocard-top"><b>{o.no}</b><span className="dk-mins">{o.mins}</span></div>
                    <div className="dk-where">{TYPE_ICON[o.type]} {o.where}</div>
                    <div className="dk-lines">{o.lines.map((l, i) => <span key={i}>{l}</span>)}</div>
                    <div className="dk-ocard-foot"><b>{omr(o.total)}<small> OMR</small></b>
                      <button className="dk-mini">{o.status === 'PENDING' ? 'Accept' : o.status === 'READY' ? 'Done' : 'Ready'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KitOrders() {
  return (
    <div className="dk">
      <div className="dk-head">
        <div><h2>Order history</h2><span className="dk-sub">{ORDERS_HISTORY.length} orders today</span></div>
        <div className="dk-seg"><button className="on">All</button><button>Completed</button><button>Declined</button></div>
      </div>
      <div className="dk-tablewrap">
        <table className="dk-table">
          <thead><tr><th>Order</th><th>Time</th><th>Type</th><th>Where</th><th>Status</th><th>Pay</th><th className="r">Total</th></tr></thead>
          <tbody>
            {ORDERS_HISTORY.map((o) => (
              <tr key={o.no}>
                <td><b>{o.no}</b></td>
                <td className="dk-mut">{o.time}</td>
                <td>{TYPE_ICON[o.type]} <span className="dk-mut">{o.type === 'DINE_IN' ? 'Dine-in' : o.type === 'CAR' ? 'Car' : 'Takeaway'}</span></td>
                <td className="dk-mut">{o.where}</td>
                <td><span className="dk-chip" style={{ ['--c' as any]: HIST_COLOR[o.status] }}><i />{o.status[0] + o.status.slice(1).toLowerCase()}</span></td>
                <td>{o.paid ? <span className="dk-paid">Paid</span> : <span className="dk-unpaid">Unpaid</span>}</td>
                <td className="r"><b>{omr(o.total)}</b> <small className="dk-mut">OMR</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KitMenu() {
  return (
    <div className="dk">
      <div className="dk-head">
        <div><h2>Menu</h2><span className="dk-sub">{MENU.reduce((s, c) => s + c.items.length, 0)} items · {MENU.length} categories</span></div>
        <button className="dk-btn">＋ Add item</button>
      </div>
      {MENU.map((cat) => (
        <section className="dk-cat" key={cat.name}>
          <div className="dk-cathead"><h3>{cat.name}</h3><span className="dk-mut">{cat.nameAr} · {cat.items.length} items</span></div>
          <div className="dk-mitems">
            {cat.items.map((it) => (
              <div className={'dk-mitem' + (it.available ? '' : ' off')} key={it.name}>
                <div className="dk-mthumb">{it.emoji}</div>
                <div className="dk-minfo"><b>{it.name}</b><span>{it.desc}{it.prep ? ` · ⏱ ${it.prep}m` : ''}</span></div>
                <div className="dk-mprice">{omr(it.price)}<small> OMR</small></div>
                <span className={'dk-switch' + (it.available ? ' on' : '')}><i /></span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function KitTables() {
  const stateLabel: Record<string, string> = { free: 'Free', busy: 'Seated', order: 'Ordering' };
  return (
    <div className="dk">
      <div className="dk-head">
        <div><h2>Tables &amp; QR</h2><span className="dk-sub">{TABLES.length} tables · scan to order</span></div>
        <button className="dk-btn">🖨 Print all</button>
      </div>
      <div className="dk-tcards">
        <div className="dk-tcard dk-tcar">
          <div className="dk-tnum">🚗 Car</div>
          <KitQr />
          <span className="dk-tstate">Outdoor</span>
        </div>
        {TABLES.map((t) => (
          <div className="dk-tcard" key={t.n}>
            <div className="dk-tnum">{t.n}</div>
            <KitQr />
            <span className={'dk-tstate s-' + t.state}>{stateLabel[t.state]}</span>
          </div>
        ))}
      </div>
      <div className="dk-note">Top seller right now · <b>{TOP_ITEMS[0].name}</b> ({TOP_ITEMS[0].qty} sold)</div>
    </div>
  );
}
