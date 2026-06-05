/**
 * End-to-end smoke test against the LIVE backend (:8080).
 * Exercises auth, both order modes, the full lifecycle, payments, tables/QR, admin.
 *   node scripts/e2e.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:8080';
const SLUG = 'mutrah-coffee';
const ADMIN = { email: 'admin@cafeqr.local', password: 'Admin123!' };
const OWNER = { email: 'owner@mutrah.coffee', password: 'Owner123!' };

let pass = 0, fail = 0;
const ok = (n, cond, extra = '') => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗ FAIL'}  ${n}${extra ? '  ·  ' + extra : ''}`); return cond; };
const section = (s) => console.log(`\n── ${s} ──`);

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let env = {}; try { env = await res.json(); } catch {}
  return { status: res.status, ok: res.ok, env, data: env.data, code: env.errorCode };
}

async function main() {
  // ---------------- AUTH ----------------
  section('Auth');
  const adminLogin = await call('/api/auth/login', { method: 'POST', body: ADMIN });
  ok('Admin login', adminLogin.ok && adminLogin.data?.user?.role === 'PLATFORM_ADMIN', adminLogin.data?.user?.role);
  const adminTok = adminLogin.data?.accessToken;

  const ownerLogin = await call('/api/auth/login', { method: 'POST', body: OWNER });
  ok('Owner login', ownerLogin.ok && ownerLogin.data?.user?.role === 'RESTAURANT_OWNER', ownerLogin.data?.user?.role);
  const ownerTok = ownerLogin.data?.accessToken;
  const ownerRefresh = ownerLogin.data?.refreshToken;

  const me = await call('/api/auth/me', { token: ownerTok });
  ok('GET /me (owner)', me.ok && me.data?.email === OWNER.email, me.data?.fullName);

  const refreshed = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: ownerRefresh } });
  ok('Token refresh', refreshed.ok && !!refreshed.data?.accessToken);

  const badLogin = await call('/api/auth/login', { method: 'POST', body: { email: OWNER.email, password: 'wrong' } });
  ok('Wrong password rejected', badLogin.status === 401 || badLogin.code === 'INVALID_CREDENTIALS', badLogin.code || badLogin.status);

  const noAuth = await call('/api/dashboard/orders/live?branchId=1');
  ok('Protected route blocks anonymous', noAuth.status === 401 || noAuth.status === 403, 'HTTP ' + noAuth.status);

  // ---------------- discover table ----------------
  const tablesRes = await call('/api/branches/1/tables', { token: ownerTok });
  const tlist = Array.isArray(tablesRes.data) ? tablesRes.data : tablesRes.data?.content || [];
  const tableToken = tlist[0]?.qrCodeToken;
  ok('Has a seeded table', !!tableToken, 'table ' + tlist[0]?.tableNumber);

  // ---------------- CUSTOMER MENU ----------------
  section('Customer menu (public)');
  const qrMenu = await call(`/api/public/qr/${tableToken}/menu`);
  ok('Menu by QR token (dine-in)', qrMenu.ok && qrMenu.data?.categories?.length > 0, (qrMenu.data?.categories?.length || 0) + ' categories');
  const slugMenu = await call(`/api/public/restaurants/${SLUG}/menu`);
  ok('Menu by slug (takeaway browse)', slugMenu.ok && slugMenu.data?.categories?.length > 0);
  const firstItem = qrMenu.data?.categories?.[0]?.items?.[0];

  // ---------------- ORDER: DINE-IN (table number) ----------------
  section('Order — DINE-IN (table number)');
  const dineIn = await call('/api/public/orders', { method: 'POST', body: {
    restaurantSlug: SLUG, branchId: 1, tableToken, orderType: 'DINE_IN', customerName: 'اختبار طاولة',
    items: [{ menuItemId: firstItem.id, quantity: 2 }],
  }});
  ok('Place dine-in order', dineIn.ok && dineIn.data?.status === 'PENDING', dineIn.data?.orderNumber + ' total=' + dineIn.data?.total);
  const dineTrack = dineIn.data?.trackingToken;
  const track = await call(`/api/public/orders/${dineTrack}`);
  ok('Track dine-in order', track.ok && track.data?.orderNumber === dineIn.data?.orderNumber);

  // ---------------- ORDER: TAKEAWAY (no table / "from the car") ----------------
  section('Order — TAKEAWAY (no table)');
  const takeaway = await call('/api/public/orders', { method: 'POST', body: {
    restaurantSlug: SLUG, branchId: 1, orderType: 'TAKEAWAY', customerName: 'سيارة', customerPhone: '90000000',
    items: [{ menuItemId: firstItem.id, quantity: 1 }],
  }});
  ok('Place takeaway order', takeaway.ok && takeaway.data?.orderType === 'TAKEAWAY', takeaway.data?.orderNumber);

  // ---------------- VALIDATION ----------------
  section('Validation');
  const empty = await call('/api/public/orders', { method: 'POST', body: { restaurantSlug: SLUG, branchId: 1, orderType: 'TAKEAWAY', items: [] } });
  ok('Empty order rejected', !empty.ok, empty.code || 'HTTP ' + empty.status);

  // ---------------- LIFECYCLE (dashboard) ----------------
  section('Order lifecycle (dashboard)');
  const id = dineIn.data?.id ?? (await findOrderId(ownerTok, dineIn.data?.orderNumber));
  const accept = await call(`/api/dashboard/orders/${id}/accept`, { method: 'PATCH', token: ownerTok, body: { prepTimeMinutes: 7 } });
  ok('Accept (set prep mins)', accept.ok && accept.data?.status === 'ACCEPTED', 'prep=' + accept.data?.prepTimeMinutes);
  const prep = await call(`/api/dashboard/orders/${id}/preparing`, { method: 'PATCH', token: ownerTok });
  ok('→ Preparing', prep.ok && prep.data?.status === 'PREPARING');
  const ready = await call(`/api/dashboard/orders/${id}/ready`, { method: 'PATCH', token: ownerTok });
  ok('→ Ready', ready.ok && ready.data?.status === 'READY');
  const complete = await call(`/api/dashboard/orders/${id}/complete`, { method: 'PATCH', token: ownerTok });
  ok('→ Completed', complete.ok && complete.data?.status === 'COMPLETED');

  // invalid transition
  const taId = takeaway.data?.id ?? (await findOrderId(ownerTok, takeaway.data?.orderNumber));
  const badTrans = await call(`/api/dashboard/orders/${taId}/ready`, { method: 'PATCH', token: ownerTok });
  ok('Invalid transition blocked', !badTrans.ok, badTrans.code || 'HTTP ' + badTrans.status);

  // payment
  const paid = await call(`/api/payments/orders/${taId}/mark-paid`, { method: 'POST', token: ownerTok, body: { method: 'CARD' } });
  ok('Mark paid (card)', paid.ok);
  // decline a fresh order
  const fresh = await call('/api/public/orders', { method: 'POST', body: { restaurantSlug: SLUG, branchId: 1, orderType: 'TAKEAWAY', items: [{ menuItemId: firstItem.id, quantity: 1 }] } });
  const freshId = fresh.data?.id ?? (await findOrderId(ownerTok, fresh.data?.orderNumber));
  const decline = await call(`/api/dashboard/orders/${freshId}/decline`, { method: 'PATCH', token: ownerTok, body: { reason: 'اختبار' } });
  ok('Decline order', decline.ok && decline.data?.status === 'DECLINED');

  // ---------------- TABLES / QR ----------------
  section('Tables & QR');
  const mk = await call('/api/branches/1/tables', { method: 'POST', token: ownerTok, body: { tableNumber: 'E2E-' + Date.now() } });
  ok('Create table', mk.ok && !!mk.data?.qrCodeUrl, mk.data?.qrCodeUrl?.includes('/r/' + SLUG) ? 'qr→customer URL' : 'qr?');
  const oldTok = mk.data?.qrCodeToken;
  const regen = await call(`/api/tables/${mk.data?.id}/regenerate-qr`, { method: 'POST', token: ownerTok });
  ok('Regenerate QR (token changes)', regen.ok && regen.data?.qrCodeToken !== oldTok);
  const rm = await call(`/api/tables/${mk.data?.id}`, { method: 'DELETE', token: ownerTok });
  ok('Delete table', rm.ok || rm.status === 204);

  // ---------------- ADMIN ----------------
  section('Admin (platform)');
  const list = await call('/api/admin/restaurants', { token: adminTok });
  const rlist = Array.isArray(list.data) ? list.data : list.data?.content || [];
  ok('List restaurants', list.ok && rlist.length >= 1, rlist.length + ' restaurants');
  const rid = rlist[0]?.id;
  const sub = await call(`/api/admin/restaurants/${rid}/subscription`, { token: adminTok });
  ok('Subscription endpoint reachable', sub.ok || sub.status === 404, sub.ok ? sub.data?.planName : 'none yet (404 ok)');
  const deact = await call(`/api/admin/restaurants/${rid}/deactivate`, { method: 'PATCH', token: adminTok });
  const react = await call(`/api/admin/restaurants/${rid}/activate`, { method: 'PATCH', token: adminTok });
  ok('Deactivate + reactivate restaurant', deact.ok && react.ok && react.data?.active === true);

  // owner cannot reach admin endpoints
  const ownerOnAdmin = await call('/api/admin/restaurants', { token: ownerTok });
  ok('Owner blocked from admin API', ownerOnAdmin.status === 403 || ownerOnAdmin.status === 401, 'HTTP ' + ownerOnAdmin.status);

  // ---------------- ANALYTICS ----------------
  section('Analytics');
  const today = await call('/api/dashboard/analytics/today', { token: ownerTok });
  ok('Today KPIs', today.ok, JSON.stringify(today.data)?.slice(0, 80));

  console.log(`\n════════ RESULT: ${pass} passed, ${fail} failed ════════`);
  process.exit(fail ? 1 : 0);
}

async function findOrderId(token, orderNumber) {
  const r = await call('/api/dashboard/orders?size=50', { token });
  const list = r.data?.content || r.data || [];
  return list.find((o) => o.orderNumber === orderNumber)?.id;
}

main().catch((e) => { console.error('✗ e2e crashed:', e); process.exit(1); });
