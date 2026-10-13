# Vetud Peptides

E-commerce store for Vetud Peptides: a Next.js storefront on top of a Medusa commerce backend.

| Layer | Tech | Hosting |
|---|---|---|
| Storefront | Next.js 16 (App Router, Cache Components) · TypeScript · MUI 9 with the **Pep Lab** theme | Vercel (Pro) |
| Commerce | Medusa 2.21: products, carts, orders, inventory, Admin dashboard | Railway (server + worker) |
| Data | Postgres 17 · Redis 7 | Railway |
| Search | Meilisearch 1.54 via `@rokmohar/medusa-plugin-meilisearch` | Railway |
| Email | Resend (Medusa notification provider, react-email templates) | Resend |

```
apps/backend      Medusa app (API at :9000, Admin at :9000/app)
apps/storefront   Next.js storefront (:8000)
docker-compose.yml  local Postgres, Redis, Meilisearch
```

The two apps are independent npm projects. There are no workspaces, because Medusa Admin uses React 18 and Next.js uses React 19.

---

## Run it locally

Prerequisites: **Node 22.22+** (Medusa's engine requirement), npm 10, Docker Desktop.

```bash
# 1. Infrastructure
docker compose up -d

# 2. Backend
cd apps/backend
cp .env.template .env          # defaults match docker-compose
npm install
npx medusa db:migrate          # also seeds regions, shipping and the catalog (first run only)
npx medusa user -e you@example.com -p <password>
npm run dev                    # http://localhost:9000/app

# 3. Storefront (new terminal)
cd apps/storefront
cp .env.example .env.local     # paste the publishable key printed by the migrate/seed step
npm install
npm run dev                    # http://localhost:8000
```

The publishable key can also be found in **Admin → Settings → Publishable API Keys**.

Without `RESEND_API_KEY`, emails are not sent; they are logged in the backend console instead.

---

## What's in the store

- **Currencies**: EUR for all 32 existing European destinations, including the UK and Switzerland; USD, CAD, AUD, JPY, CNY, SGD, HKD and AED for the main global markets. The header groups destinations by currency, with a second step for choosing a European country. Country URLs (`/us/shop`, `/de/shop`, `/jp/shop`) select the Medusa region. New global currency prices convert from EUR using the store's exchange-rate feed; existing USD/EUR prices and historical regions are preserved. The migration adds pricing markets without extending delivery zones; configure delivery methods for the seven new global destinations in Medusa before accepting shipping orders there. Re-run the idempotent setup with `npx medusa exec ./src/scripts/setup-major-markets.ts` from `apps/backend`.
- **Catalog**: 9 placeholder products (Peptide Series 01–06, Research Blends A/B, Bacteriostatic Water) in 3 categories. A "Featured" collection drives the home page.
- **Shipping**: Standard ($9.95 / €12, **free over 200**) and Express ($24.95 / €29).
- **Payment**: manual bank transfer. The order is placed and stock is reserved, then the customer is emailed payment instructions. You mark the order paid in Admin.
- **Search**: the header search, the shop page and the lot lookup all use Meilisearch. Lot numbers are indexed, so typing `VTD01-2609A` finds the product.
- **Pages**: home, shop, product, cart, 4-step checkout, order confirmation, lot documentation, standards and FAQ, contact form, legal pages (terms, privacy, shipping & returns, research use), 404, sitemap.xml and robots.txt.

### Editing products in Medusa Admin

Everything is editable in **Admin → Products**. The storefront also reads these **metadata** keys on each product:

| Key | Example | Used for |
|---|---|---|
| `code` | `VTD-01` | Product code on cards, art and search |
| `accent` | `#3cc7c2` | Colour of the product's kit-box illustration |
| `purity` | `≥ 99% (HPLC)` | Specs table and chips |
| `form` | `Lyophilized powder` | Specs table |
| `storage` | `-20 °C, desiccated` | Specs table |
| `lots` | `VTD01-2609A\|2026-09\|99.4%\|https://…/coa.pdf; VTD01-2607B\|2026-07\|99.2%` | Documentation tab, lot register, lot lookup, search |

The `lots` format is one lot per entry, with entries separated by `;` and fields by `|`: `LOT|YYYY-MM|PURITY|COA_URL`. The COA URL is optional. Without it, the site shows a "Request COA" link that goes to the contact form.

If a product has no images, the storefront draws its kit-box art from `code`, `accent` and its category (Blends show two vials, Lab Supplies a bottle). Uploaded product images replace the art automatically.

Catalog changes appear on the storefront within about a minute (cached with `cacheLife("minutes")`).

### Fulfilling an order

1. The customer orders and gets the confirmation email with bank details. You get a "New order" email.
2. When the transfer arrives: **Admin → Orders → (order) → Payment → Capture**.
3. **Create fulfillment**, then **Mark as shipped** with the tracking number. The customer gets the "shipped" email with tracking.

---

## Emails (Resend)

The templates live in `apps/backend/src/modules/resend/emails/`:

| Template | Sent when | To |
|---|---|---|
| `order-placed` | Order placed | Customer (includes payment instructions) |
| `order-placed-admin` | Order placed | `STORE_OWNER_EMAIL` |
| `shipment-created` | Shipment created in Admin | Customer (tracking) |
| `contact-message` | Contact form submitted | `STORE_OWNER_EMAIL` (reply-to is the customer) |

To preview the templates in a browser, run `npm run email:dev` in `apps/backend` (port 3030).

**Setup:** create a Resend account, verify your sending domain, then set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (an address on the verified domain), `STORE_OWNER_EMAIL`, `PAYMENT_INSTRUCTIONS` and `PAYMENT_BANK_DETAILS` on the backend.

---

## Deploy

### Backend on Railway

Create one Railway project with these services:

1. **Postgres** (Railway template)
2. **Redis** (Railway template)
3. **Meilisearch** (Railway template). Set a strong `MEILI_MASTER_KEY`.
4. **medusa-server** and 5. **medusa-worker**: two services with the same code, either from the GitHub repo (root directory `apps/backend`) or uploaded with `railway up --service <name>` from `apps/backend`. Both use `apps/backend/railway.json`. Its start command (`npm run start:railway`) runs migrations first on the server, and only starts the worker. Give medusa-server a public domain; the worker needs none.

Environment variables, shared by both Medusa services unless noted (use Railway variable references like `${{Postgres.DATABASE_URL}}`):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}?family=0` (`family=0` lets the Redis client use Railway's IPv6 private network) |
| `JWT_SECRET`, `COOKIE_SECRET` | long random strings (`openssl rand -hex 32`) |
| `AUTH_MFA_ENCRYPTION_KEY` | 64 hex chars (`openssl rand -hex 32`) |
| `STORE_CORS` | your storefront URL(s), e.g. `https://vetud.com,https://www.vetud.com`. Regex entries are allowed, e.g. `/^https:\/\/vetud-storefront-.*\.vercel\.app$/` for Vercel previews (no commas inside a regex) |
| `ADMIN_CORS`, `AUTH_CORS` | the medusa-server public URL (add the storefront URL to `AUTH_CORS`) |
| `MEDUSA_BACKEND_URL` | the medusa-server public URL (needed at **build** time for the Admin) |
| `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY` | `http://meilisearch.railway.internal:7700` and the master key (set `MEILI_HTTP_ADDR=[::]:7700` on the Meilisearch service so it listens on the private network) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STORE_OWNER_EMAIL` | see Emails |
| `STOREFRONT_URL` | storefront URL (for links in emails) |
| `PAYMENT_INSTRUCTIONS`, `PAYMENT_BANK_DETAILS` | text for the order email |
| `MEDUSA_WORKER_MODE` | `server` on medusa-server, `worker` on medusa-worker |
| `DISABLE_MEDUSA_ADMIN` | `false` on medusa-server, `true` on medusa-worker |

The first deploy of medusa-server runs migrations (`predeploy`). Those migrations also seed the store, so the catalog appears automatically. Then create your admin user with the Railway CLI:

```bash
railway run --service medusa-server -- npx medusa user -e you@example.com -p <password>
```

Copy the publishable key from Admin → Settings → Publishable API Keys.

Medusa recommends at least 2 GB of RAM for the server.

### Storefront on Vercel (Pro plan)

1. Import the repo into Vercel and set **Root Directory** to `apps/storefront` (framework: Next.js).
2. Set the environment variables:
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL` (medusa-server URL)
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_DEFAULT_COUNTRY`
   - optionally `NEXT_PUBLIC_PAYMENT_BANK_DETAILS`
3. Deploy, then add the Vercel domain(s) to the backend's `STORE_CORS` and `AUTH_CORS`.

The build fetches regions and products from the backend, so deploy the backend first.

**Hosting note.** Vercel's Acceptable Use Policy doesn't mention peptides. It does prohibit "illegal goods" and, on non-Enterprise plans, use "for an objectionable purpose", which Vercel decides at its discretion. Its Hobby plan is non-commercial, so a store needs **Pro**. The storefront uses no Vercel-only features, so it can move:

- **VPS / any Docker host**: `apps/storefront/Dockerfile` (standalone Next.js server on port 8000).
- **Cloudflare**: deploy with the OpenNext Cloudflare adapter (`@opennextjs/cloudflare`).

---

## Before going live

- [ ] Replace placeholder products, prices, lots and descriptions (Admin, or `apps/backend/src/seed/catalog.ts` before the first production deploy).
- [ ] Have the legal pages (`apps/storefront/src/content/legal.ts`) reviewed by a lawyer for each market, and fill in every `[placeholder]`.
- [ ] Check the rules for selling research materials in every country you ship to. Remove countries from the regions in Admin as needed.
- [ ] Set tax rates in Admin → Settings → Tax Regions (they start at 0%).
- [ ] Set real bank details and payment instructions (backend env, and optionally `NEXT_PUBLIC_PAYMENT_BANK_DETAILS`).
- [ ] Verify the sending domain in Resend and send yourself a test order.
- [ ] Set the warehouse address in Admin → Settings → Locations.
- [ ] Use strong secrets and a strong Meilisearch master key. Never reuse the dev values.
- [ ] Update `SITE.email` in `apps/storefront/src/lib/config.ts`.

## Next steps (not in v1)

- **Product image storage**: configure Medusa's S3 file provider (e.g. Cloudflare R2). Railway disks are wiped on redeploy, so uploads need external storage.
- **Customer accounts**: login and order history (the Medusa store API supports it).
- **Card or crypto payments**: add a Medusa payment provider. The checkout's payment step already lists whatever providers the region has.
- **Instant catalog updates**: a Medusa subscriber that calls a storefront revalidation route on product changes.

## Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Medusa with hot reload |
| backend | `npm run build` | Production build into `.medusa/server` |
| backend | `npm run lint` | Medusa lint rules (framework correctness) |
| backend | `npm run seed` | Re-run the seed (it skips itself if the catalog exists) |
| backend | `npm run email:dev` | Preview email templates |
| storefront | `npm run dev` | Next.js dev server on :8000 |
| storefront | `npm run build` | Production build (needs the backend running) |
| storefront | `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
