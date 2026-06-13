import { useSyncExternalStore } from 'react';
import { getUser, onAuthChange } from './api';
import type { Role } from './types';

export function useAuth() {
  const user = useSyncExternalStore(onAuthChange, getUser, getUser);
  return { user, authed: !!user };
}

export const isManager = (role?: Role) =>
  role === 'RESTAURANT_OWNER' || role === 'BRANCH_MANAGER';
export const canAcceptOrders = (role?: Role) => role !== 'KITCHEN_STAFF';

/**
 * Gate for the premium menu-customization tools (structural kits, occasion decor,
 * theme JSON import/export). For now only platform admins get them; flip this to a
 * subscription/plan flag once a paid "Pro look" tier exists — single source of truth.
 */
export const canUsePremiumThemes = (role?: Role) => role === 'PLATFORM_ADMIN';
