import { createContext, useContext, useEffect, type ReactNode } from 'react';

type Theme = 'light';
const Ctx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({
  theme: 'light', toggle: () => {}, setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F5EFE3');
    localStorage.removeItem('cafeqr_theme');
  }, []);
  return <Ctx.Provider value={{ theme: 'light', toggle: () => {}, setTheme: () => {} }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

export function ThemeToggle() {
  return null;
}
