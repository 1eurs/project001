import type { Plan } from './types';

/** PRO and ENTERPRISE unlock the diagnostic analytics layer (matches backend Entitlements). */
export function isProPlan(plan?: Plan | null): boolean {
  return plan === 'PRO' || plan === 'ENTERPRISE';
}

/**
 * QR badge customization (centre logo, colour, font). Open to every plan while we
 * dogfood the feature. When it becomes a paid entitlement, switch the body to
 * {@code return isProPlan(plan);} — UI already gates on this helper.
 */
export function canCustomizeQr(_plan?: Plan | null): boolean {
  return true;
}

export function isPlanRequiredError(err: unknown): boolean {
  return typeof err === 'object' && err !== null
    && 'errorCode' in err && (err as { errorCode?: string }).errorCode === 'PLAN_REQUIRED';
}