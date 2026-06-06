// Reusable decorative bits for the landing gallery: a QR-style motif and a
// small phone menu mockup. Both theme themselves from CSS variables set by the
// surrounding design, so each concept can recolor them.
import type { Copy } from './content';
import './bits.css';

/** A decorative QR-looking grid (not a real scannable code). Deterministic. */
export function QrMotif({ size = 120, className = '' }: { size?: number; className?: string }) {
  const N = 21;
  const cell = size / N;
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    const ring = (br: number, bc: number) => inBox(br, bc) && !(r > br && r < br + 6 && c > bc && c < bc + 6 && !(r > br + 1 && r < br + 5 && c > bc + 1 && c < bc + 5));
    return ring(0, 0) || ring(0, N - 7) || ring(N - 7, 0);
  };
  const inFinderArea = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
  const mods: { r: number; c: number }[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (isFinder(r, c)) mods.push({ r, c });
    else if (!inFinderArea(r, c) && ((r * 7 + c * 13 + (r % 3) * 5 + (c % 4) * 3) % 5 < 2)) mods.push({ r, c });
  }
  return (
    <svg className={'qr-motif ' + className} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden role="presentation">
      {mods.map(({ r, c }, i) => (
        <rect key={i} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} rx={cell * 0.18} />
      ))}
    </svg>
  );
}

/** A compact phone showing a café menu — the customer's order-from-car view. */
export function PhoneMock({ c, className = '' }: { c: Copy; className?: string }) {
  const p = c.phone;
  return (
    <div className={'pm ' + className} dir={c.dir} aria-hidden>
      <div className="pm-notch" />
      <div className="pm-head">
        <div className="pm-logo">{p.brand.charAt(0)}</div>
        <div className="pm-head-t"><b>{p.brand}</b><span>{p.scan}</span></div>
        <div className="pm-qr"><QrMotif size={34} /></div>
      </div>
      <div className="pm-nav"><span className="on">{p.cat}</span><span>•••</span><span>•••</span></div>
      <div className="pm-items">
        <div className="pm-item">
          <div className="pm-thumb">☕</div>
          <div className="pm-it"><b>{p.i1}</b><span>{p.i1d}</span></div>
          <strong>{p.total}</strong>
        </div>
        <div className="pm-item">
          <div className="pm-thumb alt">🫖</div>
          <div className="pm-it"><b>{p.i2}</b><span>{p.i2d}</span></div>
          <strong>١٫٢٠</strong>
        </div>
        <div className="pm-item">
          <div className="pm-thumb alt">🍰</div>
          <div className="pm-it"><b>{p.i3}</b><span>{p.cat}</span></div>
          <strong>١٫٨٠</strong>
        </div>
      </div>
      <div className="pm-cart"><span>{p.cart}</span><strong>{p.total}</strong></div>
    </div>
  );
}
