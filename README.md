# SimplePSP

A small, self-contained payment gateway built **for visual learning and demos only** — no real merchants, no real cards, no real money. It models the architecture and message flows of a real PSP (à la Computop KVP): a REST API for submitting payments, both hosted (redirect) and direct (server-to-server) integration, HMAC request signing, idempotency, a mock acquirer, signed webhooks, a payment status state machine, a merchant self-service portal, and an admin tool for managing merchants.

See [CLAUDE.md](CLAUDE.md) for the full architecture, API surface, and conventions.

## Apps and ports

| App | Port | What it is |
|-----|------|------------|
| [shop](apps/shop) | `4100` | Demo storefront. Exercises both integration modes (hosted + direct) and receives the signed webhook. |
| [gateway](apps/gateway) | `4101` | The PSP itself. Signed REST API (`/api/v1/*`), the hosted payment form (`/pay/:token`), and the webhook sender. |
| [acquirer](apps/acquirer) | `4102` | Mock bank. Approves/declines deterministically from a test-card catalog. |
| [portal](apps/portal) | `4103` | Merchant self-service dashboard (`/portal`) and the operator admin area (`/admin`) for creating and managing merchants. |

All four run together with `pnpm dev`. `packages/shared` (types, HMAC signing, the status state machine, the test-card catalog, Zod schemas) is imported by every app so there's one source of truth for how a payment moves through the system.

## Quick start

```bash
pnpm install
pnpm db:migrate   # applies the Prisma schema
pnpm db:seed      # creates the demo operator + merchant, prints their logins and API keys
pnpm dev          # starts shop, gateway, acquirer, and portal in parallel
```

Then open the shop at [http://localhost:4100](http://localhost:4100) and check out — hosted and direct modes are both available, with a test-card picker for the direct flow.

## Demo credentials

`pnpm db:seed` prints these every time it runs (the operator password is regenerated each run, the rest are fixed):

| Role | Where | Login |
|------|-------|-------|
| Merchant | [localhost:4103/login](http://localhost:4103/login) | `merchant@demo.test` / `demo_password` |
| Operator | [localhost:4103/admin/login](http://localhost:4103/admin/login) | `admin@demo.test` / *(printed on seed)* |
| API key / secret | signed requests to the gateway | `pk_demo` / `sk_demo_secret` |

## Testing the API

A Postman collection covering the signed gateway API, the portal, the admin area, the shop, and the mock acquirer is at [`postman/simplepsp.postman_collection.json`](postman/simplepsp.postman_collection.json) — import it directly, no environment file needed. It auto-signs gateway requests with a pre-request script so you never have to compute HMAC headers by hand.

## Other commands

```bash
pnpm --filter gateway dev   # run a single app
pnpm --filter shop dev
pnpm --filter portal dev
pnpm typecheck               # typecheck every workspace package
pnpm test                    # Playwright end-to-end tests
```
