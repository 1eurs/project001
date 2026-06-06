import { type CSSProperties, type ReactNode } from 'react';
import { customThemeVars, parseCustomTheme, resolveThemeId } from './menuThemes';
import { useVenue } from './venue';
import './customer.css';
import './menu-themes.css';

interface CustomerFrameProps {
  children: ReactNode;
  restaurantTheme?: string | null;
  restaurantThemeCustomJson?: string | null;
}

export function CustomerFrame({ children, restaurantTheme, restaurantThemeCustomJson }: CustomerFrameProps) {
  const venue = useVenue();
  const themeId = resolveThemeId(restaurantTheme ?? venue.restaurant?.theme);
  const customJson = restaurantThemeCustomJson ?? venue.restaurant?.themeCustomJson;
  const customStyle = themeId === 'custom' ? customThemeVars(parseCustomTheme(customJson)) : undefined;

  return (
    <div className="cust-bg" data-menu-theme={themeId} style={customStyle as CSSProperties | undefined}>
      <div className="phone">{children}</div>
    </div>
  );
}
