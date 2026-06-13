import type { CSSProperties } from 'react';
import { useI18n } from '../../lib/i18n';
import type { MenuThemeDecor } from './menuThemes';

// Designed slots (not random) so floaters land in the screen's breathing room —
// edges and corners — and the layout reads as placed stickers, not noise.
const SLOTS = [
  { top: '9%', start: '5%', rot: -14, size: 30 },
  { top: '16%', start: '82%', rot: 10, size: 24 },
  { top: '30%', start: '88%', rot: -8, size: 22 },
  { top: '44%', start: '4%', rot: 12, size: 26 },
  { top: '58%', start: '86%', rot: -12, size: 30 },
  { top: '71%', start: '6%', rot: 8, size: 22 },
  { top: '83%', start: '80%', rot: -10, size: 26 },
  { top: '25%', start: '10%', rot: 6, size: 20 },
];

/**
 * The theme's decor layer: greeting ribbon across the top + emoji stickers
 * floating over the empty space. Pure presentation — taps pass through.
 */
export function MenuDecorLayer({ decor }: { decor?: MenuThemeDecor }) {
  const { lang } = useI18n();
  if (!decor) return null;
  const banner = lang === 'ar' ? (decor.bannerAr || decor.bannerEn) : (decor.bannerEn || decor.bannerAr);
  if (decor.floaters.length === 0 && !banner) return null;

  return (
    <>
      {banner && <div className="menu-ribbon">{banner}</div>}
      {decor.floaters.length > 0 && (
        <div className="menu-floaters" aria-hidden="true">
          {SLOTS.map((slot, i) => (
            <span
              key={i}
              style={{
                top: slot.top,
                insetInlineStart: slot.start,
                fontSize: slot.size,
                opacity: decor.floaterOpacity,
                animationDelay: `${i * 0.7}s`,
                '--rot': `${slot.rot}deg`,
              } as CSSProperties}
            >
              {decor.floaters[i % decor.floaters.length]}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
