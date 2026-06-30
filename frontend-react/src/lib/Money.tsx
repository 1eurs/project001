import omrSymbolUrl from '../assets/omr-symbol.svg';
import { omr } from './format';
import './money.css';
import type { CSSProperties } from 'react';

type MoneyProps = {
  value: number;
  className?: string;
  style?: CSSProperties;
  showPlus?: boolean;
};

/** Official Omani rial symbol followed by the amount, isolated from RTL reordering. */
export function Money({ value, className = '', style, showPlus = false }: MoneyProps) {
  const negative = value < 0;
  const amount = omr(Math.abs(value));
  const sign = negative ? '−' : showPlus && value > 0 ? '+' : '';

  return (
    <span className={`money ${className}`.trim()} style={style} dir="ltr" aria-label={`${sign}${amount} OMR`}>
      <span
        className="money__symbol"
        aria-hidden="true"
        style={{
          WebkitMaskImage: `url("${omrSymbolUrl}")`,
          maskImage: `url("${omrSymbolUrl}")`,
        }}
      />
      <span className="money__amount">{sign}{amount}</span>
    </span>
  );
}
