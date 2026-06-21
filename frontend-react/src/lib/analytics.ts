// Customer-side funnel tracking. Fire-and-forget POSTs to the public analytics
// endpoint; never block or surface errors to the customer. Stages feed the Pro
// conversion funnel + item-conversion radar on the dashboard.
import { api } from './api';
import { deviceToken, sessionToken } from './customerProfile';

export type FunnelEvent =
  | 'MENU_VIEW'
  | 'ITEM_VIEW'
  | 'ADD_TO_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_PLACED';

export interface TrackContext {
  restaurantSlug: string;
  branchId?: number | null;
  qrTableToken?: string | null;
}

/** Record one funnel event. Best-effort: failures are swallowed. */
export function track(
  eventType: FunnelEvent,
  ctx: TrackContext,
  extra?: { menuItemId?: number | null; quantity?: number | null },
): void {
  api.post('/api/public/analytics/events', {
    restaurantSlug: ctx.restaurantSlug,
    branchId: ctx.branchId ?? null,
    deviceToken: deviceToken() ?? null,
    sessionToken: sessionToken(),
    qrTableToken: ctx.qrTableToken ?? null,
    eventType,
    menuItemId: extra?.menuItemId ?? null,
    quantity: extra?.quantity ?? null,
  }, { auth: false }).catch(() => { /* analytics is best-effort */ });
}
