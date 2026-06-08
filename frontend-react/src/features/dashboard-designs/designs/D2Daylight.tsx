import { CAFE, KPIS, HOURLY, TOP_ITEMS, CHANNELS, LIVE, STATUS_LABEL, STATUS_COLOR, TYPE_ICON, omr, smoothLine, smoothArea, KIT_PAGES, PAGE_META, type KitPage } from '../data';
import { KitPage as KitView } from '../kit';
import { useI18n } from '../../../lib/i18n';
import './d2.css';

export default function D2Daylight({ page, setPage }: { page: KitPage; setPage: (p: KitPage) => void }) {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const rev = HOURLY.map((h) => h.rev);
  const total = CHANNELS.reduce((s, c) => s + c.count, 0);

  const T = ar
    ? { evening: 'مساء الخير', served1: 'اليوم خدمت', served2: 'ضيفاً وحقّقت', vsYday: 'عن أمس', orders: 'طلب',
        avgPrep: 'دقيقة متوسط التحضير', revenue: 'الإيرادات', ordersToday: 'طلبات اليوم', avgOrder: 'متوسط الطلب',
        avgPrepT: 'زمن التحضير', paid: 'مدفوع مسبقاً', min: 'دقيقة', omr: 'ر.ع', kitchen: 'في المطبخ', active: 'نشِط',
        loved: 'الأكثر طلباً', howOrder: 'كيف يطلبون', sold: 'مُباع',
        status: { PENDING: 'جديد', ACCEPTED: 'مقبول', PREPARING: 'تحضير', READY: 'جاهز' } as Record<string, string> }
    : { evening: 'Good evening', served1: 'Today you served', served2: 'guests and made', vsYday: 'vs yesterday', orders: 'orders',
        avgPrep: 'min avg prep', revenue: 'Revenue', ordersToday: 'Orders today', avgOrder: 'Average order',
        avgPrepT: 'Avg. prep time', paid: 'Paid on file', min: 'min', omr: 'OMR', kitchen: 'In the kitchen', active: 'active',
        loved: 'Most loved', howOrder: 'How they order', sold: 'sold',
        status: STATUS_LABEL as Record<string, string> };

  return (
    <div className="dz-screen d2">
      <div className="d2-shell">
        <header className="d2-top">
          <div className="d2-brand">Serva<span>.</span></div>
          <nav className="d2-nav">
            {KIT_PAGES.map((p) => <a key={p} className={page === p ? 'on' : ''} onClick={() => setPage(p)}>{PAGE_META[p][lang]}</a>)}
          </nav>
          <div className="d2-right">
            <span className="d2-date">{ar ? CAFE.dateAr : CAFE.date}</span>
            <div className="d2-av">MA</div>
          </div>
        </header>

        {page === 'overview' ? (<>
        <div className="d2-hero">
          <div>
            <span className="d2-eyebrow">{T.evening} · {ar ? CAFE.nameAr : CAFE.name}، {ar ? CAFE.branchAr : CAFE.branch}</span>
            <h1>{T.served1} <em>{KPIS.guests}</em> {T.served2} <em className="accent">{omr(KPIS.revenue)}</em> <small>{T.omr}</small>.</h1>
            <div className="d2-herostats">
              <span><b className="up">↑ {KPIS.revenueDelta}%</b> {T.vsYday}</span>
              <span className="d2-dot" />
              <span>{KPIS.orders} {T.orders}</span>
              <span className="d2-dot" />
              <span>{KPIS.prepMins} {T.avgPrep}</span>
            </div>
          </div>
          <div className="d2-herochart">
            <svg viewBox="0 0 320 120" preserveAspectRatio="none">
              <defs><linearGradient id="d2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c2613b" stopOpacity=".22" /><stop offset="100%" stopColor="#c2613b" stopOpacity="0" /></linearGradient></defs>
              <path d={smoothArea(rev, 320, 120, 4)} fill="url(#d2g)" />
              <path d={smoothLine(rev, 320, 120, 4)} fill="none" stroke="#c2613b" strokeWidth="2.5" />
            </svg>
            <span className="d2-chartcap">{T.revenue} · 07:00 → 20:00</span>
          </div>
        </div>

        <div className="d2-kpis">
          <Stat label={T.ordersToday} value={String(KPIS.orders)} delta={`+${KPIS.ordersDelta}%`} />
          <Stat label={T.avgOrder} value={omr(KPIS.avgOrder)} unit={T.omr} delta={`+${KPIS.avgOrderDelta}%`} />
          <Stat label={T.avgPrepT} value={`${KPIS.prepMins}`} unit={T.min} delta={`${KPIS.prepDelta} ${T.min}`} good />
          <Stat label={T.paid} value={`${KPIS.paidRate}`} unit="%" delta="124 / 142" muted />
        </div>

        <div className="d2-cols">
          <section className="d2-panel d2-live">
            <div className="d2-phd"><h2>{T.kitchen}</h2><span className="d2-count">{KPIS.liveNow} {T.active}</span></div>
            <div className="d2-orders">
              {LIVE.map((o) => (
                <article className="d2-order" key={o.no}>
                  <div className="d2-oicon">{TYPE_ICON[o.type]}</div>
                  <div className="d2-obody">
                    <div className="d2-orow"><b>{o.no}</b><span className="d2-where">{o.where}</span></div>
                    <p>{o.lines.join(' · ')}</p>
                  </div>
                  <div className="d2-ometa">
                    <span className="d2-pill" style={{ color: STATUS_COLOR[o.status], borderColor: STATUS_COLOR[o.status] }}>{T.status[o.status]}</span>
                    <span className="d2-time">{o.mins}</span>
                    <b className="d2-total">{omr(o.total)}</b>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="d2-side">
            <section className="d2-panel">
              <div className="d2-phd"><h2>{T.loved}</h2></div>
              <ol className="d2-items">
                {TOP_ITEMS.slice(0, 5).map((it) => (
                  <li key={it.name}>
                    <span className="d2-emoji">{it.emoji}</span>
                    <span className="d2-iname">{ar ? it.nameAr : it.name}<em>{ar ? it.name : it.nameAr}</em></span>
                    <span className="d2-iqty">{it.qty}<small>{T.sold}</small></span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="d2-panel">
              <div className="d2-phd"><h2>{T.howOrder}</h2></div>
              <div className="d2-channelbar">
                {CHANNELS.map((c) => <i key={c.key} style={{ width: `${(c.count / total) * 100}%`, background: c.color }} title={ar ? c.labelAr : c.label} />)}
              </div>
              <ul className="d2-legend">
                {CHANNELS.map((c) => (
                  <li key={c.key}><i style={{ background: c.color }} />{c.icon} {ar ? c.labelAr : c.label}<b>{Math.round((c.count / total) * 100)}%</b></li>
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
