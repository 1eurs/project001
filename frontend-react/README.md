# CafeQR — Frontend (React)

Production-style React app for all three CafeQR surfaces, in the **Onyx** dark theme,
RTL/Arabic-first with an EN toggle, wired to the **real Spring Boot API**.

- **App A — Customer** (`/r/:slug/b/:branchId/t/:tableToken`, `/cart`, `/order/:trackingToken`)
- **App B — Cafe dashboard / KDS** (`/dashboard`)
- **App C — Platform admin** (`/admin`)

## Stack
Vite + React + TypeScript · React Router · TanStack Query · Zustand (cart) ·
lightweight i18n context · native `EventSource` for SSE. No CORS needed — the Vite
dev server proxies `/api` and `/files` to `http://localhost:8080`.

## Run

```bash
# 1) backend must be up on :8080 (docker compose up -d from the repo root)
# 2) seed demo data through the real API (idempotent)
npm install
npm run seed      # prints the demo slug / branch / table token + logins

# 3) start the app
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173/` for the launcher (links to all three apps + demo logins).

## Demo logins (dev)
- Owner (dashboard): `owner@mutrah.coffee` / `Owner123!`
- Platform admin: `admin@cafeqr.local` / `Admin123!`

If you reset the DB or regenerate the QR, re-run `npm run seed` and update
`src/lib/demo.ts` with the printed table token.

## Where things live
```
src/lib/        api client (envelope + JWT refresh), types, i18n, cart, sse, auth, format
src/features/customer   App A  (MenuPage / CartPage / TrackPage)
src/features/dashboard  App B  (KDS board + order actions)
src/features/admin      App C  (restaurants + subscriptions)
src/features/auth       shared login
scripts/seed.mjs        demo data seeder (uses the real API)
```

Every network call goes through `src/lib/api.ts`; search for endpoint paths to trace
a screen to its backend route.
