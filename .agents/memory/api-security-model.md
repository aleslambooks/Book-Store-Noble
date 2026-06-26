---
name: API security model & Vercel deployment config
description: Which routes are public vs admin-only, Vercel deployment setup, and deployment notes.
---

## Public routes (no auth required)
- GET /api/books, /api/books/:id, /api/books/featured, /api/books/best-sellers, /api/books/new-arrivals, /api/books/on-sale
- POST /api/orders (customer checkout)
- GET /api/orders/track (customer order tracking by orderId or phone)
- GET /api/categories
- GET /api/healthz

## Admin-only routes (require `Authorization: Bearer <token>`)
- POST/PATCH/DELETE /api/books
- GET/PATCH /api/orders, GET /api/orders/:id
- GET /api/stats/store
- GET/PATCH /api/admin/settings, /api/admin/inventory, /api/admin/analytics, /api/admin/customers, /api/admin/logs
- POST /api/admin/login, POST /api/admin/logout, GET /api/admin/me

**Why:** Books mutation and order listing exposed customer PII without auth. Fixed in Task 1.

## Vercel deployment setup (Task 2)
- Root-level `vercel.json` is the authoritative config. Vercel must point at the REPO ROOT (not a subdirectory) so pnpm workspace resolves `workspace:*` deps correctly.
- `buildCommand`: `pnpm --filter @workspace/aleslam-store build` (frontend only, skips api-server)
- `outputDirectory`: `artifacts/aleslam-store/dist` (Vite outDir changed from dist/public to dist)
- `installCommand`: `pnpm install --frozen-lockfile`
- Root vercel.json also at `artifacts/aleslam-store/vercel.json` for completeness.
- `VITE_API_BASE_URL` env var required in Vercel dashboard (points to deployed API server URL).
- DATABASE_URL is NOT needed for the frontend-only Vercel deployment.

**Why outDir was changed:** Was `dist/public`, Vercel expects `dist`. The `dist/public` path caused Vercel to serve a directory that contained only a `public/` subdirectory — index.html was one level deeper than expected → 404.

## Git push note
`git push origin main` times out in the Replit main agent (network constraint).
The platform auto-commits at task end; pushing to GitHub must be done via the GitHub integration or by reconnecting the remote.
