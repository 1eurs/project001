// Client-side cart, persisted per table token (no backend cart). Uses zustand.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine { id: number; qty: number; note: string; }

interface CartState {
  carts: Record<string, CartLine[]>;
  add: (token: string, id: number) => void;
  bump: (token: string, id: number, d: number) => void;
  setNote: (token: string, id: number, note: string) => void;
  clear: (token: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      add: (token, id) =>
        set((s) => {
          const list = s.carts[token] || [];
          const exists = list.find((l) => l.id === id);
          const next = exists
            ? list.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
            : [...list, { id, qty: 1, note: '' }];
          return { carts: { ...s.carts, [token]: next } };
        }),
      bump: (token, id, d) =>
        set((s) => {
          const next = (s.carts[token] || [])
            .map((l) => (l.id === id ? { ...l, qty: l.qty + d } : l))
            .filter((l) => l.qty > 0);
          return { carts: { ...s.carts, [token]: next } };
        }),
      setNote: (token, id, note) =>
        set((s) => ({
          carts: { ...s.carts, [token]: (s.carts[token] || []).map((l) => (l.id === id ? { ...l, note } : l)) },
        })),
      clear: (token) => set((s) => ({ carts: { ...s.carts, [token]: [] } })),
    }),
    { name: 'cafeqr_carts' },
  ),
);

export const useCart = (token: string): CartLine[] => useCartStore((s) => s.carts[token] || []);
