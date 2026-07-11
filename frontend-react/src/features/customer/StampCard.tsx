import type { CSSProperties, ReactNode } from 'react';
import { MOTIF_OPTIONS, hexAlpha, motifDataUrl, readableOn, type MenuThemeCustom } from './menuThemes';

interface StampCardProps {
  name: string;
  logoUrl?: string | null;
  rewardLabel: string;
  rewardItemNames?: string[]; // eligible free items — the customer claims ONE of them
  stamps: number;          // progress toward the current card
  stampsRequired: number;
  availableRewards: number; // completed cards waiting to be claimed
  footer?: ReactNode;       // progress / reward-ready text (caller owns the copy)
  popLast?: boolean;        // pop the most recent stamp (just earned)
  sample?: boolean;         // non-interactive illustration
  // Card studio (per-café style, set in the dashboard's Loyalty setup):
  cardColor?: string | null; // accent hex; null = inherit the surrounding skin's --accent
  cardBg?: string | null;    // card background hex; null = the skin's surface color
  stampIcon?: string | null; // emoji punched into earned stamps; null = ★
  cardMotif?: string | null; // watermark motif key from the menu-theme motif library
}

const isMotif = (m: string | null | undefined): m is MenuThemeCustom['motif'] =>
  !!m && m !== 'none' && (MOTIF_OPTIONS as string[]).includes(m);

/**
 * Inline CSS vars that skin one card (or loyalty strip) to its café's studio style.
 * A custom card background re-derives the on-card text/line colors for contrast.
 * Returns undefined when the café hasn't customized anything, so the skin tokens win.
 */
export function loyaltyCardStyle(
  cardColor?: string | null, cardMotif?: string | null, cardBg?: string | null,
): CSSProperties | undefined {
  const style: Record<string, string> = {};
  if (cardColor) {
    style['--accent'] = cardColor;
    style['--accent-2'] = cardColor;
    style['--accent-ink'] = readableOn(cardColor);
  }
  if (cardBg) {
    const ink = readableOn(cardBg);
    style['--surface'] = cardBg;
    style['--text'] = ink;
    style['--muted'] = hexAlpha(ink, 0.66);
    style['--line'] = hexAlpha(ink, 0.16);
  }
  if (isMotif(cardMotif)) {
    style['--loy-motif'] = motifDataUrl(cardMotif, cardColor || '#c79a54', 0.3);
  }
  return Object.keys(style).length ? (style as CSSProperties) : undefined;
}

/**
 * The loyalty stamp card — a café punch card with pressed-ink stamps. When a reward is ready the
 * whole card fills gold; otherwise it shows progress toward the next reward. Shared by the customer
 * portal, the order tracker, and the dashboard live preview so they never drift.
 */
export function StampCard({
  name, logoUrl, rewardLabel, rewardItemNames, stamps, stampsRequired, availableRewards, footer, popLast, sample,
  cardColor, cardBg, stampIcon, cardMotif,
}: StampCardProps) {
  const ready = availableRewards > 0;
  const icon = stampIcon?.trim() || '★';
  return (
    <div className={'loy-ticket' + (ready ? ' ready' : '') + (sample ? ' sample' : '')}
      style={loyaltyCardStyle(cardColor, cardMotif, cardBg)}>
      {isMotif(cardMotif) && <span className="loy-motif" aria-hidden="true" />}
      <div className="loy-ticket-hd">
        {logoUrl
          ? <img className="loy-logo" src={logoUrl} alt="" />
          : <span className="loy-logo" aria-hidden="true">{name.charAt(0) || '☕'}</span>}
        <div className="who">
          <h3>{name}</h3>
          <div className="reward">🎁 {rewardLabel}</div>
          {rewardItemNames && rewardItemNames.length > 0 && (
            <div className="loy-reward-chips">
              {rewardItemNames.map((n) => <span key={n}>{n}</span>)}
            </div>
          )}
        </div>
      </div>
      <div className="loy-perf" />
      <div className="loy-stamps">
        {Array.from({ length: Math.max(1, stampsRequired) }).map((_, i) => {
          const on = ready || i < stamps;
          const pop = !ready && popLast && i === stamps - 1;
          return <span key={i} className={'loy-dot' + (on ? ' on' : '') + (pop ? ' pop' : '')} aria-hidden="true">{on ? icon : ''}</span>;
        })}
      </div>
      {footer != null && <div className="loy-ticket-foot">{footer}</div>}
    </div>
  );
}
