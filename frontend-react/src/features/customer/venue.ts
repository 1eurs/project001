import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderType, PublicRestaurant, PublicBranch, PublicTable } from '../../lib/types';

interface VenueState {
  slug: string | null;
  branchId: number | null;
  tableToken: string | null;
  orderType: OrderType | null;
  restaurant: PublicRestaurant | null;
  branch: PublicBranch | null;
  table: PublicTable | null;
  setVenue: (v: Partial<VenueState>) => void;
}

export const useVenue = create<VenueState>()(
  persist(
    (set) => ({
      slug: null, branchId: null, tableToken: null, orderType: null, restaurant: null, branch: null, table: null,
      setVenue: (v) => set(v),
    }),
    { name: 'cafeqr_venue' },
  ),
);

/** Cart key: the table token when dining in, else a synthetic per-venue key. */
export const cartKeyOf = (
  slug: string | null,
  branchId: number | null,
  tableToken: string | null,
  orderType: OrderType | null = null,
) => tableToken || `${orderType === 'CAR' ? 'car' : 'venue'}:${slug}:${branchId ?? 'all'}`;

export const menuPathOf = (
  slug: string | null,
  branchId: number | null,
  tableToken: string | null,
  orderType: OrderType | null = null,
) => {
  if (!slug) return '/';
  if (tableToken) return `/r/${slug}/b/${branchId}/t/${tableToken}`;
  if (branchId != null && orderType === 'CAR') return `/r/${slug}/b/${branchId}/car`;
  if (branchId != null) return `/r/${slug}/b/${branchId}`;
  return `/r/${slug}`;
};

/** Build the right public menu endpoint for the available context. */
export const menuUrlOf = (slug: string, branchId: number | null, tableToken: string | null) =>
  tableToken
    ? `/api/public/qr/${encodeURIComponent(tableToken)}/menu`
    : branchId != null
      ? `/api/public/restaurants/${encodeURIComponent(slug)}/branches/${branchId}/menu`
      : `/api/public/restaurants/${encodeURIComponent(slug)}/menu`;
