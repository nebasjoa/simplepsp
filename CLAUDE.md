# CLAUDE.md - Demo Payment Gateway

Neven, never use em dashes in the app.

A small, self-contained payment gateway built **for visual learning and demos only** - no real merchants, no real cards, no real money. It models the architecture and message flows of a real PSP (à la Computop KVP) so the concepts become visible: a REST API for submitting payments, both **hosted (redirect)** and **direct (server-to-server)** integration, request signing, idempotency, a mock acquirer, signed webhooks, a payment status state machine, a **merchant portal** (self-service dashboard), and an **admin tool** for creating and managing merchants.

**Why this exists:** to *see* how a gateway actually works end to end. Because nothing real is at stake, we drop everything that exists only for compliance and real-money safety (PCI card vaulting, HSMs, scheme/acquirer connectivity, KYC) and keep only the pieces that teach the mechanics.

---

## Golden rules for working in this repo

1. **Never store a full card number - not even in a demo.** Persist `last4` + `brand` only. Modelling this correctly is part of the lesson.
2. **Amounts are integers in minor units** (cents), never floats. `amount: 1099` means €10.99. Currency is ISO-4217 (`"EUR"`).
3. **Sign and verify over the raw request body**, never over a re-serialized object. Whitespace/key-order differences will break HMAC. Read the raw body first, verify, *then* parse.
4. **The status state machine is authoritative.** Every transition goes through it; illegal transitions are rejected, not silently allowed.
5. **Signing, types, the state machine, and the test-card catalog live in `packages/shared`** and are imported by both gateway and shop. One source of truth.
6. **Explanations are product.** This is a teaching tool - surface *why* a payment declined, *what* a status means, and *where* card data is (and isn't) allowed to go.
7. **Scope by the session, never the request.** Portal handlers derive `merchantId` from the logged-in session, never from a body/query param. Operator and merchant auth are separate namespaces - one must never reach the other's routes.

---

## Tech stack

- **pnpm workspace monorepo** - small services with clear boundaries so the network hops (shop → gateway → acquirer, plus the webhook back) are visible rather than collapsed into one process.
- **Nuxt 3** for `gateway`, `shop`, and `portal` (Vue 3 `<script setup>`, TypeScript **strict**). Nitro server routes for APIs.
- **Nitro** standalone for the `acquirer` (may start as a module inside the gateway).
- **nuxt-auth-utils** - sealed-cookie sessions + password hashing (scrypt) for the portal (merchant login) and its `/admin` area (operator login). Demo-grade auth; don't over-build it.
- **Prisma + SQLite** - zero infra, trivial to reset between demos. Swap the datasource to MariaDB if preferred; the schema is portable.
- **Zod** for request validation.
- **Node `crypto`** for HMAC-SHA256 signing - no extra library.
- **Tailwind + Vue** for UI.
- **Playwright** for E2E.

Package manager: **pnpm**. Commands:

```bash
pnpm dev              # all apps in parallel
pnpm --filter gateway dev
pnpm --filter shop dev
pnpm --filter portal dev
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # creates the seed operator + demo merchant, prints their logins + keys
pnpm test             # Playwright E2E
pnpm typecheck
```

---

## Workspace layout

```
apps/
  gateway/     Nuxt 3 - the PSP. REST API (server/api/v1/*), hosted payment
               pages (pages/pay/*), 3DS sim, HMAC verification, webhook sender.
  shop/        Nuxt 3 - demo storefront. Exercises both integration modes,
               receives + verifies webhooks (server/api/webhooks/gateway.post.ts).
  portal/      Nuxt 3 - merchant self-service dashboard (merchant login):
               transactions, status timelines, API credentials, webhook config.
               Also hosts the /admin area (operator login) for creating +
               managing merchants. Extractable to apps/admin later.
  acquirer/    Nitro - mock bank. Approves/declines from the test-card catalog.
packages/
  shared/      types, hmac sign/verify, statusMachine, testCards, apiContract (zod).
prisma/
  schema.prisma
```

---

## The two integration flows

Both start at the shop and both end with the signed webhook. The only difference is **where the card data is entered.**

**Hosted (redirect):**
1. Shop server → `POST /v1/payments` (no card data), gets back `{ id, redirectUrl }`.
2. Shop redirects the shopper's browser (**302**) to `redirectUrl` - a page served by the *gateway*.
3. Browser `GET`s the hosted payment form; shopper enters card data there.
4. Form submit → `POST` (`application/x-www-form-urlencoded`) to the gateway (this is the direct analogue of Computop's `.aspx` post).
5. Gateway → acquirer → status; gateway **302**s the browser back to the shop's `returnUrl`.

**Direct (server-to-server):**
1. Shop collects card data itself and `POST /v1/payments` with the PAN in the body.
2. Gateway → acquirer → status returned synchronously in the API response.

> Teaching caveat to surface in the UI: the direct flow puts the merchant in the strictest PCI scope (SAQ D). It's fine here because no real cards exist, but the hosted flow (and client-side tokenization) is the pattern real gateways steer merchants toward. Say so in the demo so the lesson lands correctly.

In **both** flows, a signed **server-to-server webhook** is the source of truth for the final status - the browser redirect can be lost (closed tab, network drop), so the shop must reconcile on the webhook.

---

## REST API surface (`apps/gateway/server/api/v1/`)

All requests authenticated by HMAC (see below). Amounts in minor units.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v1/payments` | Create a payment. `captureNow: true` = sale, `false` = auth-only. Hosted if no card data (returns `redirectUrl`); direct if card data present. |
| `GET`  | `/v1/payments/:id` | Fetch current status. |
| `POST` | `/v1/payments/:id/capture` | Capture an authorized payment (`amount` optional → partial). |
| `POST` | `/v1/payments/:id/refund` | Refund a captured payment (`amount` optional → partial). |
| `POST` | `/v1/payments/:id/void` | Cancel an authorization before capture. |

Hosted-page routes (served by gateway, **not** part of the signed API):

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/pay/:token` | The hosted payment form. |
| `POST` | `/pay/:token` | Form submit (`x-www-form-urlencoded`). |
| `GET`  | `/pay/:token/3ds` | Simulated ACS challenge page (Approve/Decline). |
| `POST` | `/pay/:token/3ds` | Challenge decision submit (`x-www-form-urlencoded`). |

Create-payment request (Zod-validated):

```ts
{
  amount: number;           // minor units, integer > 0
  currency: string;         // ISO-4217, e.g. "EUR"
  reference: string;        // merchant order id
  captureNow: boolean;      // true = sale, false = auth only
  returnUrl: string;        // browser lands here after hosted flow
  webhookUrl: string;       // S2S notification target
  card?: {                  // present ⇒ DIRECT flow; absent ⇒ HOSTED
    number: string; expMonth: number; expYear: number; cvc: string;
  };
}
```

---

## Data model - `prisma/schema.prisma` (sketch)

```prisma
model Merchant {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique   // portal login
  passwordHash String              // scrypt via nuxt-auth-utils - never plaintext
  active       Boolean   @default(true)   // admin can disable; inactive ⇒ API 401
  apiKey       String    @unique   // public, sent as X-Api-Key
  secret       String              // HMAC secret, never leaves the server
  webhookUrl   String?             // default target; per-payment webhookUrl overrides
  createdAt    DateTime  @default(now())
  payments     Payment[]
}

model Operator {              // gateway staff who administer merchants
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Payment {
  id             String   @id @default(cuid())
  merchantId     String
  merchant       Merchant @relation(fields: [merchantId], references: [id])
  amount         Int                 // minor units
  currency       String
  reference      String
  status         String              // see state machine
  captureNow     Boolean
  cardBrand      String?             // "visa" - NEVER the full PAN
  cardLast4      String?             // "4242"
  hostedToken    String?  @unique    // for /pay/:token
  idempotencyKey String?
  returnUrl      String
  webhookUrl     String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  refunds        Refund[]
  @@unique([merchantId, idempotencyKey])
}

model Refund {
  id        String   @id @default(cuid())
  paymentId String
  payment   Payment  @relation(fields: [paymentId], references: [id])
  amount    Int
  status    String
  createdAt DateTime @default(now())
}

model WebhookDelivery {
  id        String   @id @default(cuid())
  paymentId String
  eventType String
  status    String              // pending | delivered | failed
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
}

model SettlementBatch {           // one row per admin-triggered batch run
  id           String    @id @default(cuid())
  status       String              // "completed"
  paymentCount Int       @default(0)
  settledCount Int       @default(0)
  failedCount  Int       @default(0)
  createdAt    DateTime  @default(now())
  payments     Payment[]
}
```

`Payment` also carries `settlementBatchId` (FK to the batch that settled it, if any), `settledAmount` (net of refunds, minor units), `settlementOutcome` (`"settled" | "failed"`), and `settlementReason`.

`db:seed` creates: one **operator** (`admin@demo.test` / a printed password) so the admin area works immediately, and one **demo merchant** with a portal login (`merchant@demo.test`) plus **known, printed** API credentials (`apiKey = "pk_demo"`, `secret = "sk_demo_secret"`) so the shop works out of the box. Print every credential on seed - this is a demo, discoverability beats secrecy.

### Payment status state machine - `packages/shared/statusMachine.ts`

```
initiated ──approve──► authorized ──capture──► captured ──refund──► refunded
    │                      │                       │        │
    │                      ├──void──► voided       │        └─partial─► partially_refunded ──► refunded
    │                      └──expire─► expired     └──settle──► settled ◄──settle── partially_refunded
    ├──decline──► declined
    └──error────► failed
```

- `captureNow: true` collapses `initiated → captured` on approval (a "sale").
- Terminal states: `declined`, `failed`, `voided`, `expired`, `refunded`, `settled`.
- Export `canTransition(from, to): boolean` and a `transition(payment, event)` that throws on illegal moves. Every status write goes through it.
- `settled` is only reached via the batch settlement run (see the Settlement section below), never a merchant API call. Simplification: once settled there are no further transitions - refunds must happen *before* settlement in this model. Real PSPs support post-settlement reversals; that's out of scope here.

---

## HMAC request signing - `packages/shared/hmac.ts`

The core "this is how gateways really authenticate merchants" lesson. Close to Computop's signed-request model.

**Merchant sends** on every API call:

```
X-Api-Key: pk_demo
X-Timestamp: 1720598400          // unix seconds, replay guard
X-Signature: <hex hmac>
```

**Signature** = HMAC-SHA256 over the canonical string `` `${timestamp}.${rawBody}` `` using the merchant `secret`, hex-encoded.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function sign(secret: string, timestamp: number, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verify(secret: string, timestamp: number, rawBody: string, sig: string): boolean {
  const expected = sign(secret, timestamp, rawBody);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sig, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
```

**Gateway verification order** (a Nitro middleware over `/v1/*`):
1. Read the **raw** body (`readRawBody`) - before any parsing.
2. Look up merchant by `X-Api-Key`; unknown key → `401` + `WWW-Authenticate`.
3. Reject if `|now - X-Timestamp| > 300s` → `401` (replay protection).
4. `verify(...)`; mismatch → `401`. Use `timingSafeEqual` - never `===`.
5. Only now parse + Zod-validate the body.

The **same mechanism signs outbound webhooks** (gateway signs with the merchant secret; shop verifies). Reusing one util for both directions is deliberate.

---

## Idempotency

`POST /v1/payments` accepts an `Idempotency-Key` header. Store the key (scoped per merchant) with the resulting payment. On replay with the same key: return the **original** response, don't create a second payment. Same key + different body → `409 Conflict`. This is the concrete demo of why `409` exists.

---

## Mock acquirer + test cards - `packages/shared/testCards.ts`

The acquirer decides purely from the card number, deterministically (like Stripe's test suite). No randomness - demos must be reproducible.

| Card number | Outcome | Resulting status |
|-------------|---------|------------------|
| `4242 4242 4242 4242` | Approved | `authorized` / `captured` |
| `4000 0000 0000 0002` | Declined (generic) | `declined` |
| `4000 0000 0000 9995` | Declined (insufficient funds) | `declined` |
| `4000 0000 0000 0069` | Declined (expired card) | `declined` |
| `4000 0000 0000 0119` | Processing error | `failed` |
| `4000 0000 0000 3220` | Requires 3DS challenge | `initiated` → redirected to `/pay/:token/3ds` → `authorized`/`captured` or `declined` |

Each entry carries a human-readable `reason` the UI surfaces on the result screen. Detect brand from the IIN prefix for `cardBrand`; keep only `last4`.

---

## Webhooks (gateway → shop)

On every terminal status change the gateway POSTs the merchant's `webhookUrl`:

```json
{ "event": "payment.captured", "paymentId": "...", "status": "captured", "amount": 1099, "currency": "EUR", "reference": "..." }
```

Signed with the same HMAC headers. The shop's receiver (`apps/shop/server/api/webhooks/gateway.post.ts`) verifies the signature over the raw body before trusting it, then reconciles its local order. Record each attempt in `WebhookDelivery`. Retries with backoff are Phase 2.

`payment.settled` fires the same way once a payment's status flips to `settled` during a batch run - `sendWebhook` derives the event name from the payment's current status, so no separate code path is needed.

---

## Batch settlement (gateway ↔ acquirer, admin-triggered)

`capture` is a purely local status flip - it never talks to the acquirer. Settlement is the missing money-movement step: periodically the gateway submits everything it has captured (across **all** merchants) to the acquirer in one batch, the acquirer confirms which items cleared, and only then does a payment become `settled` - the point at which the gateway can honestly tell a merchant "this is yours."

- **Trigger**: an operator, from `/admin/settlements` in the portal. One action settles everything eligible for every merchant at once - there's no per-merchant or manual selection.
- **Ownership**: the batch logic (querying eligible payments, calling the acquirer, running `transition(..., "settle")`, sending webhooks) lives in the **gateway** (`POST /api/internal/settlements/run`), not the portal - consistent with the gateway being the only place that ever calls the acquirer or writes payment status. The portal's `/admin/settlements` page only *reads* `Payment`/`SettlementBatch` rows directly from the shared DB (same pattern as the merchants list) and calls the gateway to trigger a run.
- **Trust boundary**: this is neither a merchant API call (HMAC) nor an operator session (cookie) - it's service-to-service. A shared `INTERNAL_ADMIN_SECRET`, sent as `X-Internal-Secret`, gates `/api/internal/*` on the gateway via `server/middleware/internal-auth.ts`, checked with `timingSafeEqual` like everything else that compares secrets in this repo.
- **Eligibility**: `status IN ("captured", "partially_refunded") AND settlementBatchId IS NULL`. The settled amount nets out any refunds already applied.
- **Acquirer**: `POST /settle` on the mock acquirer takes `{ items: [{ paymentId, amount, currency }] }` and returns a per-item outcome. It's deterministic-always-succeeds for now (these payments were already authorized, so real-world failure here is rare) but the shape supports per-item failure so a future decline scenario is a small addition, not a redesign. A failed item stays in its prior status and is retried on the next run.
- **Audit trail**: every run creates a `SettlementBatch` row (even a zero-payment run) and each settled `Payment` links back to it via `settlementBatchId`.

---

## Merchant portal - `apps/portal` (merchant login)

The self-service dashboard a merchant uses to work with their own account - the demo's stand-in for the Stripe Dashboard / Computop Analytics. Scoped strictly to the logged-in merchant: every query filters by the session's `merchantId`, and a merchant can never see another merchant's data.

Auth: email + password (scrypt hash) → sealed-cookie session via `nuxt-auth-utils`. A server middleware guards all `/portal/*` routes and every `server/api/portal/*` handler resolves `merchantId` from the session, never from the request body.

Pages:

| Route | Purpose |
|-------|---------|
| `/login` | Merchant sign-in. |
| `/portal` | Overview - recent payments, totals by status. |
| `/portal/payments` | Paginated, filterable transaction list (status, date, reference). |
| `/portal/payments/:id` | Payment detail: the status **timeline**, amount, `last4`/brand, and its `WebhookDelivery` history. |
| `/portal/credentials` | View `apiKey`, reveal + **rotate** `secret` (shown once), set the default `webhookUrl`. |
| `/portal/test` | Fire a hosted or direct test payment against this account - handy for live demos. |

Rules: secret rotation invalidates the old secret immediately and is the only time the raw secret is shown. All portal reads go through the same state-machine-backed `status`; the portal never writes payment status directly.

---

## Merchant administration - `/admin` (operator login)

The gateway operator's tool for onboarding and managing merchants. Lives as an `/admin` route group inside the portal app but behind a **separate** auth boundary (an `Operator` session, not a `Merchant` one) - the two never share a session. Extractable to `apps/admin` later without changing the model.

Pages:

| Route | Purpose |
|-------|---------|
| `/admin/login` | Operator sign-in. |
| `/admin/merchants` | List all merchants with active/inactive state and basic volume. |
| `/admin/merchants/new` | **Create a merchant.** |
| `/admin/merchants/:id` | Edit name, enable/disable, rotate keys, reset portal password. |
| `/admin/settlements` | Pending-eligible summary, **run a batch settlement** for all merchants at once, and history of past batches. |
| `/admin/settlements/:id` | One batch's detail: per-merchant totals and per-payment outcomes. |

**Create-merchant flow** (`/admin/merchants/new`): operator enters `name` + `email`; the server generates `apiKey` (public, e.g. `pk_live_…`) and `secret` (HMAC), generates an initial portal password (or invite), hashes the password, and stores the merchant `active: true`. The `apiKey`, `secret`, and initial password are **shown once** on the confirmation screen - after that the secret is never retrievable, only rotatable. Never log or email the raw secret.

**Disable** sets `active: false`. The gateway's HMAC middleware must reject API calls from an inactive merchant with `401`, and the portal login must refuse an inactive account - enforce `active` in both places, not just the UI.

Guard: an operator-session middleware protects `/admin/*` and `server/api/admin/*`. Keep operator and merchant auth in separate session namespaces so one can never escalate into the other.

---

## MVP - acceptance checklist

- [ ] pnpm workspace + Prisma + SQLite; `db:seed` creates and prints the seed operator + demo merchant (logins + API keys).
- [ ] `packages/shared`: types, `hmac` sign/verify, `statusMachine`, `testCards`, zod `apiContract`.
- [ ] Gateway HMAC middleware over `/v1/*` (raw body, key lookup, timestamp skew, timing-safe compare).
- [ ] `POST /v1/payments` handles **both** direct (card in body) and hosted (returns `redirectUrl`).
- [ ] `GET /v1/payments/:id`, `capture`, `refund`, `void` - all routed through the state machine.
- [ ] Idempotency-Key on create: replay returns original, conflict returns `409`.
- [ ] Hosted payment form at `/pay/:token`; `x-www-form-urlencoded` submit → acquirer → 302 back to `returnUrl`.
- [ ] Mock acquirer resolves outcomes from the test-card table with reasons.
- [ ] Signed webhook fired on terminal status; shop receiver verifies signature and reconciles.
- [ ] Shop: checkout offering both modes, success/failure pages, webhook handler.
- [ ] Never persists a full PAN (only `last4` + `brand`) - enforced and tested.
- [ ] Merchant portal: login, payment list + detail with status timeline, credentials page with secret rotation, default webhook config - all scoped to the session `merchantId`.
- [ ] Admin `/admin`: operator login, merchant list, **create merchant** (generates apiKey + secret + initial password, shown once), enable/disable.
- [ ] `active: false` blocks both the API (HMAC middleware → `401`) and portal login.
- [ ] Operator and merchant sessions are separate namespaces; neither can access the other's routes.
- [ ] Batch settlement: `/admin/settlements` runs one batch across all merchants, gateway-owned via `POST /api/internal/settlements/run` (internal-secret gated), acquirer `/settle` returns per-item outcomes, settled payments fire `payment.settled` webhooks.
- [ ] Playwright: hosted happy path (4242 → captured); a direct decline (…0002 → declined); admin creates a merchant and that merchant then logs into the portal and sees the payment; admin runs a settlement batch and the payment shows `settled`.

---

## Later phases

**Phase 2** - partial captures; `expire` flow; webhook retries with exponential backoff.

**Phase 3** - scheduled/automatic settlement runs (today it's admin-triggered only); modeling occasional settlement failures with a retry-eligible reason catalog; optionally wire this to the HTTP Simulator so the same payment can be inspected at the wire level; MariaDB datasource swap if moving off SQLite.

---

## Conventions

- TypeScript strict; no `any` in `packages/shared`.
- Validate every inbound request with Zod at the boundary; reject with a clear `400` body.
- Money is always integer minor units; format for display only at the edge.
- Signature verification is always over raw bytes and always timing-safe.
- Every new flow ships with a Playwright test asserting the resulting status and (where relevant) the webhook payload.
- Keep user-facing copy (decline reasons, status labels, the PCI caveat) accurate and plain - it's the teaching surface.