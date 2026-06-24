import type { Plan } from './types';

/** PRO and ENTERPRISE unlock the diagnostic analytics layer (matches backend Entitlements). */
export function isProPlan(plan?: Plan | null): boolean {
  return plan === 'PRO' || plan === 'ENTERPRISE';
}

export function isPlanRequiredError(err: unknown): boolean {
  return typeof err === 'object' && err !== null
    && 'errorCode' in err && (err as { errorCode?: string }).errorCode === 'PLAN_REQUIRED';
}