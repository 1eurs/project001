import { useSyncExternalStore } from 'react';
import { getUser, onAuthChange } from './api';
import type { Permission, UserResponse } from './types';

export function useAuth() {
  const user = useSyncExternalStore(onAuthChange, getUser, getUser);
  return { user, authed: !!user };
}

type MaybeUser = UserResponse | null | undefined;

/** Whether the signed-in user holds a given permission. */
export const can = (user: MaybeUser, perm: Permission) => !!user?.permissions?.includes(perm);

/** Has any restaurant-management screen (menu/team/QR/profile/analytics) or is the owner. */
export const isManager = (user?: MaybeUser) =>
  !!user && (user.owner
    || can(user, 'MENU') || can(user, 'TEAM') || can(user, 'QR_TABLES')
    || can(user, 'PROFILE') || can(user, 'ANALYTICS') || can(user, 'BRANCHES'));

export const canAcceptOrders = (user?: MaybeUser) => can(user, 'ORDERS');

/**
 * Gate for the premium menu-customization tools (structural kits, occasion decor,
 * theme JSON import/export). For now only platform admins get them; flip this to a
 * subscription/plan flag once a paid "Pro look" tier exists — single source of truth.
 */
export const canUsePremiumThemes = (user?: MaybeUser) => can(user, 'PLATFORM_ADMIN');
