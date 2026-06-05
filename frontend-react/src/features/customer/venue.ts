import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicRestaurant, PublicBranch, PublicTable } from '../../lib/types';

interface VenueState {
  slug: string | null;
  branchId: number | null;
  tableToken: string | null;
  restaurant: PublicRestaurant | null;
  branch: PublicBranch | null;
  table: PublicTable | null;
  setVenue: (v: Partial<VenueState>) => void;
}

export const useVenue = create<VenueState>()(
  persist(
    (set) => ({
      slug: null, branchId: null, tableToken: null, restaurant: null, branch: null, table: null,
      setVenue: (v) => set(v),
    }),
    { name: 'cafeqr_venue' },
  ),
);

/** Cart key: the table token when dining in, else a synthetic per-venue key. */
export const cartKeyOf = (slug: string | null, branchId: number | null, tableToken: string | null) =>
  tableToken || `venue:${slug}:${branchId ?? 'all'}`;

/** Build the right public menu endpoint for the available context. */
export const menuUrlOf = (slug: string, branchId: number | null, tableToken: string | null) =>
  tableToken
    ? `/api/public/qr/${encodeURIComponent(tableToken)}/menu`
    : branchId != null
      ? `/api/public/restaurants/${encodeURIComponent(slug)}/branches/${branchId}/menu`
      : `/api/public/restaurants/${encodeURIComponent(slug)}/menu`;
