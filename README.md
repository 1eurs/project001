# CafeQR — QR Ordering Platform Backend

A clean, production-style **modular monolith** backend for small Oman cafes. Customers scan a
QR code at their table, browse a bilingual (AR/EN) menu, place an order, and track it live.
Cafe staff manage orders from a dashboard with real‑time updates.

No frontend is included — but every API a React/Next.js frontend needs is implemented.

## Stack

- **Java 21**, **Spring Boot 3.4**
- **PostgreSQL** + **Spring Data JPA / Hibernate**
- **Flyway** migrations (schema is the single source of truth; Hibernate runs in `validate` mode)
- **Spring Security + JWT** (access + refresh tokens, BCrypt)
- **Server-Sent Events (SSE)** for realtime order updates (no Kafka/broker)
- **springdoc-openapi / Swagger UI**
- **Docker + docker-compose**
- **JUnit 5, Mockito, Testcontainers**

## Architecture

A single deployable application organized into cohesive modules under `com.cafeqr`:

```
auth          JWT auth, security config, AccessGuard (tenant isolation)
users         staff/owner accounts + role-hierarchy management
restaurants   tenant root (slug, currency, VAT)
branches      per-restaurant branches
tables        QR tables + token generation
menus         bilingual categories & items, public menu, order-time validation
orders        order lifecycle, SSE streams
payments      stub provider (manual mark-paid/failed); ready for Thawani/Tap
subscriptions simple per-restaurant subscription tracking
notifications channel-agnostic abstraction (logging now; WhatsApp/SMS/email later)
analytics     dashboard metrics (counts, revenue, best-sellers, busiest hours)
uploads       image upload abstraction (local now; S3 later)
common        API envelope, exceptions, base entity, config, utils
```

**Multi-tenancy** is row-level: every tenant-owned row carries `restaurant_id` / `branch_id`,
and `AccessGuard` is consulted in every service so a user only ever touches their own
restaurant/branch. `PLATFORM_ADMIN` is unrestricted.

### Roles

| Role | Scope |
|------|-------|
| `PLATFORM_ADMIN` | everything: restaurants, subscriptions, all data |
| `RESTAURANT_OWNER` | one restaurant: branches, staff, menus, orders |
| `BRANCH_MANAGER` | one branch |
| `STAFF` | orders for their branch |
| `KITCHEN_STAFF` | kitchen/prep status for their branch |

## Quick start (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL and the backend on **http://localhost:8080**.

- Swagger UI: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

In the `dev` profile a **platform admin is seeded** on first boot:

```
email:    admin@cafeqr.local
password: Admin123!     # change immediately
```

(Disable by setting `app.bootstrap.enabled=false`, or just don't run the `dev` profile.)

## Run locally (without Docker for the app)

```bash
# 1. Start Postgres (Docker is easiest)
docker run --rm -e POSTGRES_DB=cafeqr -e POSTGRES_USER=cafeqr -e POSTGRES_PASSWORD=cafeqr \
  -p 5432:5432 postgres:16-alpine

# 2. Run the app
./mvnw spring-boot:run        # or: mvn spring-boot:run
```

## The MVP flow (curl)

```bash
BASE=http://localhost:8080

# 1. Register the first platform admin (only works while none exists)
ADMIN=$(curl -s -X POST $BASE/api/auth/register-platform-admin \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Admin","email":"admin@demo.com","password":"Admin123!"}' \
  | jq -r .data.accessToken)

# 2. Create a restaurant
RID=$(curl -s -X POST $BASE/api/admin/restaurants -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Cafe","vatEnabled":true,"vatRate":5}' | jq -r .data.id)
SLUG=$(curl -s $BASE/api/admin/restaurants/$RID -H "Authorization: Bearer $ADMIN" | jq -r .data.slug)

# 3. Create the restaurant owner
curl -s -X POST $BASE/api/users -H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Owner\",\"email\":\"owner@demo.com\",\"password\":\"Owner123!\",\"role\":\"RESTAURANT_OWNER\",\"restaurantId\":$RID}"

# 4. Owner logs in
OWNER=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"owner@demo.com","password":"Owner123!"}' | jq -r .data.accessToken)

# 5. Branch, 6. Table, 7. Category, 8. Item
BID=$(curl -s -X POST $BASE/api/restaurants/$RID/branches -H "Authorization: Bearer $OWNER" \
  -H 'Content-Type: application/json' -d '{"name":"Main Branch"}' | jq -r .data.id)
TOKEN=$(curl -s -X POST $BASE/api/branches/$BID/tables -H "Authorization: Bearer $OWNER" \
  -H 'Content-Type: application/json' -d '{"tableNumber":"T1"}' | jq -r .data.qrCodeToken)
CID=$(curl -s -X POST $BASE/api/menu/categories -H "Authorization: Bearer $OWNER" \
  -H 'Content-Type: application/json' -d '{"nameEn":"Coffee","nameAr":"قهوة"}' | jq -r .data.id)
IID=$(curl -s -X POST $BASE/api/menu/items -H "Authorization: Bearer $OWNER" -H 'Content-Type: application/json' \
  -d "{\"categoryId\":$CID,\"nameEn\":\"Latte\",\"nameAr\":\"لاتيه\",\"price\":1.500}" | jq -r .data.id)

# 9. Customer scans QR -> public menu
curl -s $BASE/api/public/qr/$TOKEN/menu | jq

# 10. Customer places a dine-in order
TRACK=$(curl -s -X POST $BASE/api/public/orders -H 'Content-Type: application/json' \
  -d "{\"restaurantSlug\":\"$SLUG\",\"branchId\":$BID,\"tableToken\":\"$TOKEN\",\"orderType\":\"DINE_IN\",\"items\":[{\"menuItemId\":$IID,\"quantity\":1}]}" \
  | jq -r .data.trackingToken)

# 11. Dashboard sees it; 12-14 staff accept -> preparing -> ready -> complete
OID=$(curl -s "$BASE/api/dashboard/orders" -H "Authorization: Bearer $OWNER" | jq -r .data.content[0].id)
curl -s -X PATCH $BASE/api/dashboard/orders/$OID/accept -H "Authorization: Bearer $OWNER" \
  -H 'Content-Type: application/json' -d '{"prepTimeMinutes":10}' | jq .data.status
curl -s -X PATCH $BASE/api/dashboard/orders/$OID/preparing -H "Authorization: Bearer $OWNER" | jq .data.status
curl -s -X PATCH $BASE/api/dashboard/orders/$OID/ready -H "Authorization: Bearer $OWNER" | jq .data.status
curl -s -X PATCH $BASE/api/dashboard/orders/$OID/complete -H "Authorization: Bearer $OWNER" | jq .data.status

# 15. Customer tracks the order
curl -s $BASE/api/public/orders/$TRACK | jq .data.status
```

## Realtime (SSE)

- **Dashboard:** `GET /api/dashboard/orders/stream` — branch staff get their branch's events;
  owners/admins pass `?branchId=` (or stream the whole restaurant). Because browsers' `EventSource`
  can't set headers, the JWT may be passed as `?access_token=...`.
- **Customer:** `GET /api/public/orders/{trackingToken}/stream` — pushes status changes for one order.

Events: `order.created`, `order.accepted`, `order.declined`, `order.preparing`, `order.ready`,
`order.completed`, `order.cancelled`.

## Order status machine

```
PENDING ──▶ ACCEPTED ──▶ PREPARING ──▶ READY ──▶ COMPLETED
   │            │             │
   ├─▶ DECLINED │             │
   └─▶ CANCELLED◀─────────────┘   (PENDING/ACCEPTED/PREPARING may be cancelled)
```
`DECLINED`, `COMPLETED`, `CANCELLED` are terminal. Invalid transitions return
`400 INVALID_ORDER_STATUS_TRANSITION`.

## Payments

Online payment is **optional** — most customers pay by **card or cash at the cafe**. Orders are
created `UNPAID` and move through the whole kitchen lifecycle regardless of payment (nothing blocks
on it). Staff (owner/manager/admin) settle in person:

```bash
# default method is CARD (the common at-cafe case)
POST /api/payments/orders/{orderId}/mark-paid
# or record cash explicitly
POST /api/payments/orders/{orderId}/mark-paid   {"method":"CASH"}
POST /api/payments/orders/{orderId}/mark-failed
```

`method` is one of `CASH | CARD | ONLINE | OTHER`. A real gateway (Thawani/Tap) can later settle
orders with `method=ONLINE` and a real provider id without changing any callers.

## Cafe subscriptions (billing the platform)

A separate money flow from customer payments: how each **cafe pays the platform** for CafeQR. A
subscription has a `billingCycle` of **`ONE_TIME`** (single lifetime payment) or **`MONTHLY` / `YEARLY`**
(recurring), a per-cycle `price`, a `status` (`TRIAL|ACTIVE|PAST_DUE|CANCELLED|EXPIRED`), and dates.
One-time plans default to `ACTIVE`; recurring plans default to `TRIAL`. The response exposes a derived
`currentlyActive` flag. Managed by platform admin via
`POST/GET /api/admin/restaurants/{id}/subscription` and `PATCH /api/admin/subscriptions/{id}`.

## API response envelope

```jsonc
// success
{ "success": true, "message": "Order created successfully", "data": { } }
// error
{ "success": false, "message": "Menu item is not available", "errorCode": "MENU_ITEM_UNAVAILABLE" }
```

## Money & VAT

OMR uses **3 decimal places** (baisa). Monetary columns are `NUMERIC(12,3)`. VAT is computed as
`subtotal × vatRate%` (half-up, 3 dp) only when the restaurant has VAT enabled.

## Configuration

Key `app.*` / Spring settings (see `application.yml`); override via environment variables:

| Env var | Purpose |
|---------|---------|
| `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | database connection |
| `APP_JWT_SECRET` | Base64 HMAC secret (≥32 bytes decoded) |
| `APP_PUBLIC_BASE_URL` | base URL used in QR/file URLs |
| `APP_CORS_ORIGINS` | comma-separated allowed origins |
| `APP_STORAGE_DIR` | local upload directory |

## Testing

```bash
mvn test
```

- Unit tests (fast): order totals/VAT, status machine, JWT round-trip, tenant `AccessGuard`.
- **Integration test** (`CafeQrFlowIntegrationTest`) runs against a real PostgreSQL via
  **Testcontainers** — it drives the entire MVP flow, verifies tenant isolation and JWT auth,
  and doubles as the schema contract test (the context only starts if Flyway and Hibernate
  `validate` agree). Requires Docker.

## Frontend

A reference frontend lives in **`frontend-react/`** (Vite + React + TypeScript, Onyx dark theme,
RTL/Arabic-first) covering all three surfaces — customer (`/r/...`), dashboard (`/dashboard`), admin
(`/admin`) — wired to this API.

```bash
docker compose up -d                 # backend on :8080
cd frontend-react && npm install
npm run seed                         # seed demo data via the real API (prints logins + table token)
npm run dev                          # http://localhost:5173 (proxies /api + /files → :8080)
```

See **`FRONTEND_GUIDE.md`** for the full page-by-page build guide (every screen mapped to its endpoint),
and `frontend-react/README.md` for app specifics.

## Project layout

```
src/main/java/com/cafeqr/<module>/{domain,repository,dto,...}
src/main/resources/
  application.yml, application-dev.yml
  db/migration/V1__init.sql, V2__payment_method.sql, V3__subscription_billing_cycle.sql
frontend-react/        reference React app (see FRONTEND_GUIDE.md)
frontend/              earlier static HTML prototypes (design reference)
FRONTEND_GUIDE.md      page-by-page frontend build guide
Dockerfile, docker-compose.yml
```
