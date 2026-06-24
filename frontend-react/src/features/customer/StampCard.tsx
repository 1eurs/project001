import type { ReactNode } from 'react';

interface StampCardProps {
  name: string;
  logoUrl?: string | null;
  rewardLabel: string;
  stamps: number;          // progress toward the current card
  stampsRequired: number;
  availableRewards: number; // completed cards waiting to be claimed
  footer?: ReactNode;       // progress / reward-ready text (caller owns the copy)
  popLast?: boolean;        // pop the most recent stamp (just earned)
  sample?: boolean;         // non-interactive illustration
}

/**
 * The loyalty stamp card — a café punch card with pressed-ink stamps. When a reward is ready the
 * whole card fills gold; otherwise it shows progress toward the next reward. Shared by the customer
 * portal, the order tracker, and the dashboard live preview so they never drift.
 */
export function StampCard({
  name, logoUrl, rewardLabel, stamps, stampsRequired, availableRewards, footer, popLast, sample,
}: StampCardProps) {
  const ready = availableRewards > 0;
  return (
    <div className={'loy-ticket' + (ready ? ' ready' : '') + (sample ? ' sample' : '')}>
      <div className="loy-ticket-hd">
        {logoUrl
          ? <img className="loy-logo" src={logoUrl} alt="" />
          : <span className="loy-logo" aria-hidden="true">{name.charAt(0) || '☕'}</span>}
        <div className="who">
          <h3>{name}</h3>
          <div className="reward">🎁 {rewardLabel}</div>
        </div>
      </div>
      <div className="loy-perf" />
      <div className="loy-stamps">
        {Array.from({ length: Math.max(1, stampsRequired) }).map((_, i) => {
          const on = ready || i < stamps;
          const pop = !ready && popLast && i === stamps - 1;
          return <span key={i} className={'loy-dot' + (on ? ' on' : '') + (pop ? ' pop' : '')} aria-hidden="true">{on ? '★' : ''}</span>;
        })}
      </div>
      {footer != null && <div className="loy-ticket-foot">{footer}</div>}
    </div>
  );
}
