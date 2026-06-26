---
name: API security model
description: Which routes are intentionally public vs admin-only, and deployment notes.
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

## Vercel compatibility
- CORS supports `ALLOWED_ORIGINS` env var (comma-separated full origins) in addition to `REPLIT_DOMAINS`.
- Frontend supports `VITE_API_BASE_URL` env var to point to a separate API deployment.
- `artifacts/aleslam-store/vercel.json` contains SPA routing rewrites.

## Git push note
`git push origin main` times out in the Replit main agent (network constraint).
The platform auto-commits at task end; pushing to GitHub must be done via the GitHub integration or by reconnecting the remote.
