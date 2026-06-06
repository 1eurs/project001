# Serva. — Frontend Build Guide

This document tells the frontend team **exactly what to build** and **which backend API powers each
screen**. Every endpoint below already exists and is verified in this backend.

> ✅ **A reference implementation already exists** in **`frontend-react/`** (Vite + React + TS, Onyx
> dark theme, RTL/AR-first) covering all three surfaces and wired to the live API. This guide is both
> the spec **and** the map to that code. To run it:
> ```bash
> docker compose up -d            # backend on :8080
> cd frontend-react && npm install
> npm run seed                    # creates demo data via the real API; prints logins + table token
> npm run dev                     # http://localhost:5173 (proxies /api and /files → :8080)
> ```
> Demo logins: owner `owner@mutrah.coffee` / `Owner123!`, platform admin `admin@cafeqr.local` /
> `Admin123!`. Every network call goes through `frontend-react/src/lib/api.ts` — grep an endpoint path
> there to jump from a screen to its backend route. See `frontend-react/README.md` for details.

---

## 1. The three surfaces

Three surfaces with different users, auth, and design:

| # | App | Users | Auth | Device | Route group (as built) |
|---|-----|-------|------|--------|------------------------|
| **A** | **Customer ordering** | Guests | None (public + opaque tokens) | Mobile browser (phone) | `/r/...`, `/cart`, `/order/:token` |
| **B** | **Serva dashboard** | Owner, Branch manager, Staff, Kitchen | JWT login | Tablet / desktop | `/dashboard` |
| **C** | **Platform admin** | Platform admin | JWT login | Desktop | `/admin` |

> **As implemented:** all three surfaces live in **one Vite + React app** (`frontend-react/`),
> separated by route group — not three deployments. The customer routes are public; `/dashboard` and
> `/admin` are gated by the authenticated user's role (`GET /api/auth/me`).

**Stack (as built):** Vite + React + TypeScript, **TanStack Query** (data/caching), **Zustand** (cart),
a lightweight i18n context for AR/EN, native **EventSource** for SSE, and a single `api.ts` client that
unwraps the response envelope and refreshes the JWT on 401.

---

## 2. Shared foundations (read first)

### 2.1 API base & response envelope
Base URL: `http://localhost:8080` (configurable). **Every** response uses:

```jsonc
// success
{ "success": true, "message": "Order created successfully", "data": { /* payload */ } }
// error
{ "success": false, "message": "Menu item is not available", "errorCode": "MENU_ITEM_UNAVAILABLE" }
```

Build one `apiClient` that unwraps `data` on success and throws `{ message, errorCode, httpStatus }`
on failure. Show `message` to users; branch on `errorCode` for special handling.

### 2.2 Auth (apps B & C)
- `POST /api/auth/login` → `{ accessToken, refreshToken, tokenType, expiresInSeconds, user }`.
- Store `accessToken` (memory or short-lived) + `refreshToken` (httpOnly cookie preferred, or
  secure storage). Send `Authorization: Bearer <accessToken>` on every dashboard/admin call.
- On `401`, call `POST /api/auth/refresh { refreshToken }` once → retry. If that 401s → logout.
- `GET /api/auth/me` → current user (id, fullName, email, role, restaurantId, branchId). Use the
  **role** to decide which nav/menu items and routes to show.
- `POST /api/auth/logout` revokes refresh tokens.

**Roles:** `PLATFORM_ADMIN`, `RESTAURANT_OWNER`, `BRANCH_MANAGER`, `STAFF`, `KITCHEN_STAFF`.
The backend also enforces all of this; the frontend just hides what the user can't use.

### 2.3 Errors worth special-casing (`errorCode`)
`INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `RESTAURANT_INACTIVE`,
`BRANCH_INACTIVE`, `TABLE_INVALID`, `MENU_ITEM_UNAVAILABLE`, `INVALID_ORDER_STATUS_TRANSITION`,
`EMPTY_ORDER`, `VALIDATION_ERROR`, `FORBIDDEN`, `NOT_FOUND`.

### 2.4 Money (OMR)
All prices/totals are **OMR with 3 decimals** (e.g. `1.500`, `0.945`). Always format to **3 decimal
places**. Fields: `subtotal`, `vatAmount`, `total`, item `price`/`lineTotal`. VAT is precomputed by
the backend — never compute it on the client; just display `vatAmount` and `total`.

### 2.5 Bilingual + RTL
Every menu entity has `nameEn`/`nameAr` (and `descriptionEn`/`descriptionAr`). Build a language
toggle (AR default for customers). When `ar`, set `dir="rtl"`. Show the active language's field,
fall back to the other if empty.

### 2.6 Images
Upload returns a full URL string (`{ "url": "http://localhost:8080/files/..." }`). Store that URL on
the entity (`logoUrl`, `imageUrl`). Just render it directly.

### 2.7 Realtime (SSE)
Use `EventSource`. Listen for named events and update cache.
- **Customer:** `new EventSource('/api/public/orders/{trackingToken}/stream')`
- **Dashboard:** `new EventSource('/api/dashboard/orders/stream?branchId={id}&access_token={jwt}')`
  — `EventSource` can't set headers, so pass the JWT as `access_token` query param.

Event names: `connected`, `order.created`, `order.accepted`, `order.declined`, `order.preparing`,
`order.ready`, `order.completed`, `order.cancelled`. Each event's `data` is the full order object.

---

## 3. App A — Customer ordering (public, mobile)

Entry point is the QR code, which encodes:
`/r/{restaurantSlug}/b/{branchId}/t/{tableToken}`

### Route tree
```
/r/:slug/b/:branchId/t/:tableToken     → Menu (dine-in, table known)
/r/:slug/b/:branchId                    → Menu (branch, takeaway / no table)
/r/:slug                               → Menu (restaurant-wide)
/cart                                  → Cart & checkout (client state)
/order/:trackingToken                  → Live order tracking
```

### Pages

**A1. Menu page** *(the main screen)*
- **Data:** `GET /api/public/qr/{tableToken}/menu` (preferred — returns restaurant + branch + table +
  categories with items). For no-table browsing use
  `GET /api/public/restaurants/{slug}/branches/{branchId}/menu` or `.../{slug}/menu`.
- **Shows:** restaurant header (logo, name), language toggle, categories as sections, each item with
  name (AR/EN), description, `price` (OMR 3dp), image, and an **Add** button. Disable/grey items
  where `available=false`.
- **Components:** `RestaurantHeader`, `LangToggle`, `CategoryNav` (sticky), `MenuItemCard`,
  `CartBar` (sticky bottom: item count + total + "View cart").
- **State:** cart is **client-side only** (localStorage keyed by tableToken). No API for cart.
- **Empty/err:** `RESTAURANT_INACTIVE`/`TABLE_INVALID` → friendly "menu unavailable" screen.

**A2. Cart & checkout**
- **Shows:** chosen items (qty steppers, per-item note), order type (DINE_IN if table token present,
  else TAKEAWAY), optional name/phone, order note, live subtotal (client estimate — **final totals
  come from the server response**).
- **Submit:** `POST /api/public/orders`
  ```jsonc
  { "restaurantSlug": "...", "branchId": 1, "tableToken": "...", "orderType": "DINE_IN",
    "customerName": "Sara", "customerPhone": "9xxxxxxx", "customerNote": "no sugar",
    "items": [ { "menuItemId": 12, "quantity": 2, "note": "extra hot" } ] }
  ```
  Response `data` includes `trackingToken`, `orderNumber`, `subtotal`, `vatAmount`, `total`, `status`.
- **On success:** clear cart, route to `/order/{trackingToken}`.
- **No online payment step** — the customer pays **card/cash at the cafe**. Placing the order does not
  charge anything; staff settle it later from the dashboard. (An online-pay step can be added later via
  the payments module without changing this flow.)
- **Errors:** `MENU_ITEM_UNAVAILABLE` (an item went unavailable) → highlight & ask to remove;
  `TABLE_INVALID`, `BRANCH_INACTIVE` → block with message.

**A3. Order tracking** *(live)*
- **Data:** `GET /api/public/orders/{trackingToken}` → full tracking view (status, items,
  totals, `prepTimeMinutes`, timestamps, `declineReason`).
- **Live:** open SSE `/api/public/orders/{trackingToken}/stream`; on each event, refetch or merge.
- **Shows:** a **status stepper** (see §6), order number, items, total, estimated prep time when
  `ACCEPTED`, and the decline reason if `DECLINED`.
- Persist `trackingToken` in localStorage so a returning customer can reopen their order.

---

## 4. App B — Serva dashboard (staff, login)

### Route tree (role-gated)
```
/login
/                         → redirect to /orders/live
/orders/live              → Live order board (KDS)         [all staff]
/orders                   → Orders history (table)         [all staff]
/orders/:id               → Order detail                   [all staff]
/menu                     → Categories & items management   [owner, manager]
/menu/items/:id           → Item editor                    [owner, manager]
/tables                   → Tables & QR codes               [owner, manager]
/branches                 → Branches                        [owner]
/staff                    → Staff accounts                  [owner, manager]
/analytics                → Reports                         [owner, manager]
/settings                 → Profile / restaurant settings   [owner]
```

### Pages

**B1. Login** — `POST /api/auth/login`. After success, `GET /api/auth/me`, store role, redirect.

**B2. Live order board (KDS)** *(the most important staff screen)*
- **Initial data:** `GET /api/dashboard/orders/live?branchId={id}` → active orders
  (PENDING/ACCEPTED/PREPARING/READY) **with line items**.
- **Live:** SSE `/api/dashboard/orders/stream?branchId={id}&access_token={jwt}`. On `order.created`
  play a sound + add card; on other events, update/move the card.
- **Layout:** Kanban columns by status — **New (PENDING) · Accepted · Preparing · Ready**. Each card
  shows order number, table/takeaway, items+qty, total, elapsed time, customer note.
- **Actions per card (PATCH):**
  - PENDING → `/accept` (modal: prep minutes) or `/decline` (modal: reason)
  - ACCEPTED → `/preparing`
  - PREPARING → `/ready`
  - READY → `/complete`
  - any active → `/cancel` (modal: optional reason)
  - Also: **mark paid** (card/cash) → see B7.
- **Scope:** branch staff are auto-scoped to their branch; **owners/managers** get a **branch
  selector** that sets `branchId`.
- **Kitchen role:** show only New→Preparing→Ready columns and the preparing/ready actions.

**B3. Orders history**
- **Data:** `GET /api/dashboard/orders?status={?}&branchId={?}&page={n}&size={n}` → **paged**
  summaries (no line items). Supports Spring paging params (`page`, `size`, `sort`).
- **Shows:** filterable/sortable table (order #, time, type, status, payment status, total).
  Row → `/orders/:id`.

**B4. Order detail**
- **Data:** `GET /api/dashboard/orders/{id}` → full order incl. items, notes, all timestamps.
- **Shows:** everything in B2 card plus internal note, timeline, payment panel (B7), and the same
  lifecycle action buttons (guarded by current status).

**B5. Menu management**
- **Categories:** `GET /api/menu/categories?restaurantId={?}&branchId={?}`,
  `POST /api/menu/categories`, `PATCH /api/menu/categories/{id}`, `DELETE /api/menu/categories/{id}`.
- **Items:** `GET /api/menu/items?restaurantId={?}&branchId={?}&categoryId={?}`,
  `GET /api/menu/items/{id}`, `POST /api/menu/items`, `PATCH /api/menu/items/{id}`,
  `DELETE /api/menu/items/{id}`, and a fast toggle `PATCH /api/menu/items/{id}/availability {available}`.
- **Image:** `POST /api/uploads/menu-items` (multipart `file`) → put returned `url` into the item's
  `imageUrl`.
- **Notes for the form:** `nameEn`, `nameAr`, `price` (3dp) required; `branchId` null = item shows at
  all branches; `displayOrder` controls sort. Owners pick a branch (or "all branches"); managers are
  auto-scoped to their branch (the `branchId`/`restaurantId` fields are ignored for them server-side).
- **UI:** a big toggle on each item card for "Available now" (uses the availability endpoint) — this
  is the most-used menu action during service.

**B6. Tables & QR**
- **Data:** `GET /api/branches/{branchId}/tables`, `POST /api/branches/{branchId}/tables {tableNumber}`,
  `PATCH /api/tables/{id}`, `DELETE /api/tables/{id}`, `POST /api/tables/{id}/regenerate-qr`.
- **Shows:** table list with a rendered **QR code** (generate client-side from `qrCodeUrl`) and a
  **Print** button (print sheet of table-tents). "Regenerate" invalidates the old QR.

**B7. Payments (panel on order detail / KDS card)**
- **Mark paid:** `POST /api/payments/orders/{orderId}/mark-paid` — default **CARD**; send
  `{ "method": "CASH" }` for cash (`CASH|CARD|ONLINE|OTHER`).
- **Mark failed:** `POST /api/payments/orders/{orderId}/mark-failed`.
- Payment is **optional** and never blocks the order — show a small "Unpaid / Paid (card/cash)" chip;
  most orders are settled at the counter.

**B8. Staff accounts** *(owner & manager)*
- **Data:** `GET /api/users?restaurantId={?}&branchId={?}`, `POST /api/users`,
  `PATCH /api/users/{id}`, `PATCH /api/users/{id}/activate`, `PATCH /api/users/{id}/deactivate`.
- **Create form:** fullName, email, password, **role**, branch. Role choices depend on creator:
  owner → BRANCH_MANAGER/STAFF/KITCHEN_STAFF; manager → STAFF/KITCHEN_STAFF (backend enforces).

**B9. Branches** *(owner)*
- `GET /api/restaurants/{restaurantId}/branches`, `POST /api/restaurants/{restaurantId}/branches`,
  `GET /api/branches/{id}`, `PATCH /api/branches/{id}`, activate/deactivate. Fields: name, address,
  phone, openingHours.

**B10. Analytics**
- `GET /api/dashboard/analytics/today` — today's KPIs.
- `GET /api/dashboard/analytics/orders?from=YYYY-MM-DD&to=YYYY-MM-DD` — range summary:
  totals per status, `totalRevenue`, `averageOrderValue`, `bestSellingItems`, `busiestHours`.
- `GET /api/dashboard/analytics/best-selling-items?from=&to=&limit=`.
- **UI:** KPI cards (orders, revenue, AOV, completion rate), a bar chart of busiest hours, a
  best-sellers table.

**B11. Settings** — `GET/PATCH` the restaurant via admin endpoints if owner has access, or a profile
form (`PATCH /api/users/{id}` for own password). Logo upload: `POST /api/uploads/restaurants/logo`.

---

## 5. App C — Platform admin (login)

### Route tree
```
/login
/restaurants                  → list / create
/restaurants/:id              → edit, activate/deactivate, owner, subscription
/restaurants/:id/subscription → manage subscription
```
- **First-time setup:** `POST /api/auth/register-platform-admin` (only works while no admin exists).
- **Restaurants:** `GET /api/admin/restaurants?active=`, `POST /api/admin/restaurants`,
  `GET/PATCH /api/admin/restaurants/{id}`, `.../activate`, `.../deactivate`.
- **Create the restaurant owner:** `POST /api/users { role: "RESTAURANT_OWNER", restaurantId }`.
- **Subscriptions (how the cafe pays the platform):** `POST /api/admin/restaurants/{id}/subscription`,
  `GET /api/admin/restaurants/{id}/subscription`, `PATCH /api/admin/subscriptions/{id}`. Fields:
  `planName`, `billingCycle` (`ONE_TIME | MONTHLY | YEARLY`), `price` (per cycle, or the one-off
  amount), `status` (`TRIAL|ACTIVE|PAST_DUE|CANCELLED|EXPIRED`), `startDate`, `endDate`, plus a
  derived `currentlyActive`. **UI:** a billing-cycle selector (One-time / Monthly / Yearly) drives whether
  you collect a recurring price + renewal date or a single lifetime price.

---

## 6. Order status → UI mapping

| Status | Customer stepper | KDS column | Allowed actions | Color |
|--------|------------------|------------|-----------------|-------|
| `PENDING` | "Sent — waiting for the cafe" | **New** | accept, decline, cancel | amber |
| `ACCEPTED` | "Accepted · ~N min" | Accepted | preparing, cancel | blue |
| `PREPARING` | "Being prepared" | Preparing | ready, cancel | indigo |
| `READY` | "Ready!" | Ready | complete | green |
| `COMPLETED` | "Completed" | (leaves board) | — | grey |
| `DECLINED` | "Declined: {reason}" | (leaves board) | — | red |
| `CANCELLED` | "Cancelled" | (leaves board) | — | grey |

Disable any action whose transition isn't allowed; the server returns
`400 INVALID_ORDER_STATUS_TRANSITION` if you try anyway.

---

## 7. Key screen sketches

**Customer menu (mobile)**
```
┌──────────────────────────┐
│ S. Mutrah Coffee   [AR|EN]│
│ Table 5 · Dine-in        │
├──────────────────────────┤
│ Coffee ───────────────── │
│ ┌──────────────────────┐ │
│ │ [img] Karak   0.300  │ │
│ │ كرك                +  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ [img] Latte   1.500  │ │
│ │ (unavailable)        │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ 🛒 2 items · 1.575  View →│   ← sticky cart bar
└──────────────────────────┘
```

**KDS board (tablet)**
```
 NEW (2)        ACCEPTED (1)    PREPARING (3)   READY (1)
┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐
│#001012   │   │#001010   │    │#001008   │    │#001007   │
│Table 5   │   │Table 2   │    │Takeaway  │    │Table 9   │
│2× Karak  │   │1× Latte  │    │3× Karak  │    │1× Latte  │
│0.945  2m │   │1.575  6m │    │0.900 11m │    │1.575 14m │
│[Accept]  │   │[Preparing]    │[Ready]   │    │[Complete]│
│[Decline] │   │[Cancel]  │    │[Cancel]  │    │ 💳 Paid  │
└──────────┘   └──────────┘    └──────────┘    └──────────┘
```

---

## 8. Build order (milestones)

**Milestone 1 — Order loop (the demo):**
1. App A: Menu (by QR token) → Cart → Place order → Tracking (+ SSE).
2. App B: Login → KDS live board (+ SSE) → accept/preparing/ready/complete.
→ This is the full customer↔cafe loop and proves the product.

**Milestone 2 — Make a cafe self-serviceable:**
3. App B: Menu management (categories, items, availability toggle, image upload).
4. App B: Tables & QR (create + print).
5. App C: Restaurants + create owner + login.

**Milestone 3 — Operations & polish:**
6. App B: Orders history + detail, payments (mark paid card/cash), staff accounts, branches.
7. App B: Analytics. App C: Subscriptions.
8. i18n/RTL pass, empty/error states, offline-tolerant tracking, sounds, print styles.

---

## 9. Decisions

**Settled (in `frontend-react/`):**
- **App structure:** one app, role/route-gated (`/r...` public, `/dashboard` + `/admin` gated). ✅
- **Framework:** Vite + React + TypeScript (dev server proxies `/api` + `/files` → :8080, so no CORS). ✅

**Still open:**
- **Token storage:** currently JS storage (simple). For production, prefer an httpOnly cookie for the
  refresh token.
- **QR target domain:** the QR encodes a **frontend** URL (`/r/:slug/b/:branchId/t/:tableToken`) which
  loads `GET /api/public/qr/:tableToken/menu`. Set the backend's `APP_PUBLIC_BASE_URL` to the public
  site's domain so generated `qrCodeUrl`s point there (dev uses `http://localhost:8080`).
- **Cash vs card at settle:** the dashboard's "mark paid" currently defaults to `CARD`; add a
  Card/Cash choice if staff need to record cash explicitly (`POST .../mark-paid {"method":"CASH"}`).

---

## 10. Endpoint quick reference

```
AUTH
  POST   /api/auth/register-platform-admin
  POST   /api/auth/login | /refresh | /logout
  GET    /api/auth/me

PUBLIC (customer, no auth)
  GET    /api/public/restaurants/{slug}/menu
  GET    /api/public/restaurants/{slug}/branches/{branchId}/menu
  GET    /api/public/qr/{tableToken}/menu
  POST   /api/public/orders
  GET    /api/public/orders/{trackingToken}
  GET    /api/public/orders/{trackingToken}/stream            (SSE)

DASHBOARD ORDERS (staff)
  GET    /api/dashboard/orders?status=&branchId=&page=&size=
  GET    /api/dashboard/orders/live?branchId=
  GET    /api/dashboard/orders/{id}
  PATCH  /api/dashboard/orders/{id}/accept  {prepTimeMinutes}
  PATCH  /api/dashboard/orders/{id}/decline {reason}
  PATCH  /api/dashboard/orders/{id}/preparing | /ready | /complete
  PATCH  /api/dashboard/orders/{id}/cancel  {reason?}
  GET    /api/dashboard/orders/stream?branchId=&access_token=  (SSE)

MENU MGMT (owner/manager)
  GET/POST            /api/menu/categories         PATCH/DELETE /api/menu/categories/{id}
  GET/POST            /api/menu/items              GET/PATCH/DELETE /api/menu/items/{id}
  PATCH              /api/menu/items/{id}/availability {available}

TABLES (owner/manager)
  GET/POST  /api/branches/{branchId}/tables
  PATCH/DELETE /api/tables/{id}    POST /api/tables/{id}/regenerate-qr

BRANCHES (owner)
  GET/POST  /api/restaurants/{restaurantId}/branches
  GET/PATCH /api/branches/{id}    PATCH /api/branches/{id}/activate|deactivate

USERS (admin/owner/manager)
  GET/POST  /api/users    PATCH /api/users/{id}    PATCH /api/users/{id}/activate|deactivate

PAYMENTS (owner/manager/admin)
  POST  /api/payments/orders/{id}/mark-paid  {method?}    POST .../mark-failed

ANALYTICS (owner/manager)
  GET  /api/dashboard/analytics/today
  GET  /api/dashboard/analytics/orders?from=&to=
  GET  /api/dashboard/analytics/best-selling-items?from=&to=&limit=

UPLOADS (owner/manager)
  POST  /api/uploads/menu-items       (multipart file)
  POST  /api/uploads/restaurants/logo (multipart file)

ADMIN (platform admin)
  GET/POST  /api/admin/restaurants    GET/PATCH /api/admin/restaurants/{id}
  PATCH     /api/admin/restaurants/{id}/activate|deactivate
  POST/GET  /api/admin/restaurants/{id}/subscription   PATCH /api/admin/subscriptions/{id}
```

> Full interactive contract: **Swagger UI at `/swagger-ui.html`** (and OpenAPI JSON at
> `/v3/api-docs`) — generate a typed client from it.
