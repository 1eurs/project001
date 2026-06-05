import { useSyncExternalStore } from 'react';
import { getUser, onAuthChange } from './api';
import type { Role } from './types';

export function useAuth() {
  const user = useSyncExternalStore(onAuthChange, getUser, getUser);
  return { user, authed: !!user };
}

export const isManager = (role?: Role) =>
  role === 'PLATFORM_ADMIN' || role === 'RESTAURANT_OWNER' || role === 'BRANCH_MANAGER';
export const canAcceptOrders = (role?: Role) => role !== 'KITCHEN_STAFF';
