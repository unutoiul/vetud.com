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
- **Crypto (optional)**: hosted checkout through [MakePay](https://makepay.io). Off until `MAKEPAY_ENCRYPTION_KEY` is set on the backend. See [Crypto payments (MakePay)](#crypto-payments-makepay).
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

### Crypto payments (MakePay)

Uses the `@makecrypto/medusa-plugin-makepay` plugin (pinned) and needs a MakePay merchant account. Nothing changes for shoppers until all of these are done:

1. On **both** Railway Medusa services set `MAKEPAY_ENCRYPTION_KEY` (`openssl rand -base64 32`, never rotate it) and optionally `MAKEPAY_SETTLEMENT_CURRENCY`. `MEDUSA_BACKEND_URL` and `STOREFRONT_URL` must be the public HTTPS URLs. The first deploy runs the plugin's migration.
2. Admin → **Settings → MakePay → Connect MakePay**, choose the company and approve.
3. Admin → **Settings → Regions**: edit **every** region, enable the `pp_makepay_makepay` payment provider and save.
4. Redeploy the storefront (it caches the provider list). Optional `NEXT_PUBLIC_MAKEPAY_CHECKOUT_ORIGIN` (default `https://www.makepay.io`, only change it for sandbox testing).

Checkout then offers "Pay with cryptocurrency": the order is created, the shopper pays on MakePay's hosted page, and returns to `/order/makepay-return`, which waits for the backend's confirmed-paid status before showing the confirmation. The plugin does not support automated refunds; refund crypto payments manually in MakePay.

### Card and ACH checkout (NMI)

The backend pins the community [`medusa-payment-nmi` provider](https://medusajs.com/integrations/medusa-payment-nmi) at **0.4.2**. A local wrapper adds currency validation, authenticated payment state, server-derived billing, and capture safeguards. This does **not** create or approve a merchant account. MakePay and manual payments remain separate options; PayPal is unchanged.

The storefront uses the plugin's Classic API-compatible **Collect.js hosted fields** for cards and optional US ACH. It does not install the unverified React SDK. [NMI now recommends its newer Payment Component/REST API for new integrations](https://docs.nmi.com/docs/collectjs); confirm continued Classic API support with your processor. **Apple Pay/Google Pay are not exposed by this storefront yet**: leave `NMI_WALLETS_ENABLED=false` until a compatible wallet UI, domain registration and sandbox/device testing are completed. Changing that flag alone does not implement wallets.

#### Before enabling it

1. Obtain written underwriting approval for the actual catalog, delivery formats, buyer types and countries. Ask the processor to provision **NMI**, with card authorization/capture and any separately approved ACH/wallet services. An RUO disclaimer alone is not approval.
2. Obtain sandbox credentials from the processor/NMI. On both backend services configure the variables in [the environment template](apps/backend/.env.template): `NMI_SECURITY_KEY`, `NMI_TOKENIZATION_KEY`, `NMI_WEBHOOK_SECRET`, `NMI_ACCOUNT_CURRENCY`, `NMI_MERCHANT_COUNTRY`; set `NMI_ENABLED=true` and keep `NMI_ENVIRONMENT=sandbox`. Never put private keys in storefront variables or chat. `NODE_ENV=production` does not enable live transactions.
3. Enable `pp_nmi_primary` in Medusa Admin → Settings → Regions **only for regions whose currency matches the NMI account**. The server rejects mismatches; it never silently charges EUR totals as USD. This integration does not convert a charge or select between multiple currency-specific MIDs.
4. Register `https://<backend>/hooks/payment/nmi_primary` in NMI. Use the portal-generated signing secret. Enable `transaction.check.status.settle`, `transaction.check.status.return`, and `transaction.check.status.latereturn` for ACH. Localhost requires a public HTTPS tunnel; do not expose Admin unnecessarily. Generic sale/capture/batch events do not release an ACH hold.
5. Leave `NMI_ACH_ENABLED=false` until ACH is provisioned and tested; it requires a USD account. Keep `NMI_WALLETS_ENABLED=false`: that reserved backend flag does not add a wallet UI. Wallet implementation also needs account/domain configuration and device tests. Neither flag grants processor approval.
6. Test authorized card → full capture → shipment; decline/cancel; full/partial refunds; ACH submission → signed settlement; bad signatures; duplicate, return and late-return events; and wrong-currency rejection. Confirm real gateway and Medusa records agree before choosing `NMI_ENVIRONMENT=live` with live keys. Local mock tests do not certify the merchant account.

#### Operations and limits

- Cards authorize at checkout. Packing may start while authorized; **capture the full amount in Medusa before marking shipped**. Capture is not automatically triggered by a shipment event. Authorization validity is set by the acquirer: do not leave holds indefinitely.
- Partial **captures** are rejected because this plugin does not pass their amount to NMI. Partial **refunds** are a separate operation supported by the upstream provider; verify settlement/refund behavior in sandbox first.
- ACH is submitted, not paid, when the order is created. Never manually capture it. Verified, transaction-correlated settlement records capture; pending/returned debits remain held even if someone previously marked them captured.
- The checkout requires one-time debit consent and records its version/time/account classification in signed payment state, without account numbers. Personal online debits use WEB; business-account debits use CCD. Before enabling ACH, have your acquirer confirm both SEC codes, authorization wording/copies/retention and first-use account validation. A checkbox and tokenization alone do **not** certify ACH compliance; see [Nacha's account-validation guidance](https://www.nacha.org/content/account-validation-resource-center).
- Returns and late returns set a sticky review hold. They do not automatically refund, cancel or re-debit an order. Review the gateway, shipment and inventory before resolving them; shipped returns require manual dispute/recovery handling.
- Account order history and confirmation use customer-scoped endpoints and a server-derived payment summary. Pending, returned or unverified ACH payments never inherit an old "Paid" label. Existing shipment tracking remains available after a return. Gateway state/metadata is not sent by these endpoints; offline receipts contain display fields only, belong to one signed-in account, and are never treated as proof of payment.
- Native Admin fulfillment/shipment endpoints run the payment guard before their core workflows. Custom automations must also invoke `guardNmiPaymentWorkflow` before fulfillment/shipment; do not bypass it by directly calling lower-level modules.
- The generic core NMI webhook mapper is disabled in the wrapper. The reconciliation workflow owns ACH settlement. Portal-initiated card captures, refunds or voids are **not** automatically synchronized: perform these in Medusa, or reconcile manually if done in NMI.
- No Customer Vault / saved-card implementation is included. Names and addresses still reuse the customer's saved profile; sensitive payment details are tokenized by NMI. Signed payment state uses the gateway security key: key rotation requires a migration/reconciliation plan for outstanding authorizations, refunds and historical webhook verification.
- Money-moving requests use a single attempt with a 30-second timeout; the wrapper disables the plugin's automatic POST retries, refund-to-void fallback, and acceptance of failed ACH voids. On an ambiguous response, check NMI and order history before submitting another payment/refund. This is not an exactly-once gateway guarantee: a failed browser response does not mean no authorization/debit occurred.
- Verify AVS/CVV and any required 3-D Secure/SCA rules with the acquirer before launch. The upstream billing mapper sends AVS fields only when name, street, city, province/state and postal code are all present; do not assume international AVS or SCA coverage from installation alone.

#### Merchant-account shortlist — public sources checked 26 October 2026

These are providers' published offers, **not confirmed approval or negotiated pricing for Vetud**. Final merchant-country eligibility, exact SKUs, gateway, acquiring bank, processing currency, fees, reserves and payout terms must be confirmed in writing.

| Specialist | Published position and next step |
|---|---|
| [AllayPay](https://allaypay.com/industries/peptides-merchant-services/) | Explicit domestic-US RUO offer, including qualified startups without LegitScript. Startup upfront reserves and 5–10% rolling/upfront reserves are stated. Its banner also advertises a $100k/month minimum: clarify which program applies. Offers NMI/Authorize.net. |
| [PayFirmly](https://www.payfirmly.com/blogs/payment-processor-for-peptides-businesses) | Advertises peptide/research-chemical acquiring and its own gateway. Ask whether it can provision NMI; its own API is not automatically compatible with this adapter. Country, startup criteria and fees need a quote. |
| [Instabill](https://instabill.com/merchant-services/merchant-accounts/offshore/) | Publishes international/offshore high-risk placement and bank-specific settlement terms. No current, explicit RUO approval commitment was verified. Request SKU-specific eligibility and the actual gateway. |
| [Signature Payments](https://signaturepayments.com/industries/peptides/) | Explicitly markets RUO research suppliers but distinguishes RUO from clinical/telehealth underwriting. Request country/startup eligibility and NMI provisioning; not a blanket acceptance guarantee. |
| [SensaPay](https://sensapay.com/high-risk-industries/peptide-merchant-account) | Markets research-supplier/peptide accounts, tokenization and 3DS. Its peptide FAQ repeats unrelated adult-business rate text, so do not use those numbers as a peptide quote. Obtain written terms and gateway details. |
| [Easy Pay Direct](https://www.easypaydirect.com/blog/peptide-merchant-account-fast-and-easy-payment-processing/) | Peptide article requires LegitScript. Its newer [compliance page](https://www.easypaydirect.com/help-center/merchant-accounts-overview/compliance-legal-requirements/compliance-requirements-for-merchants/) lists peptides as typically prohibited. Not a confirmed uncertified-RUO route. |
| [Corepay](https://corepay.net/industries/best-peptide-merchant-accounts/) | Explicitly excludes RUO sellers and targets licensed healthcare/LegitScript-certified operators. Exclude from a pure-RUO shortlist unless its underwriting policy changes. |
| [2Accept](https://www.2accept.net/industries/peptides) | Explicit RUO offer with product/buyer review. Published peptide text starts around 3.5% for certified ecommerce and says RUO is higher; headline tier rates are not an RUO quote. Confirm startup criteria, reserves and NMI availability. |
| [Moneck](https://moneck.com/peptide-merchant-account/) | Advertises peptide accounts and negotiates reserves, payout minimums, country/registration, FX and API terms individually. RUO startup/LegitScript requirements are not settled by that page. |
| [Truevo](https://truevo.com/online-payments/) | Malta-based acquirer with hosted/API checkout and multicurrency acceptance. No official public confirmation of the claimed no-LegitScript RUO acceptance was verified. Ask its underwriting team before selecting it. |

For a qualifying US RUO business, AllayPay, Signature Payments and 2Accept are reasonable **prequalification enquiries**, subject to the real product formats and startup volume. For a non-US entity, confirm the merchant and bank countries first. Do not submit identical applications claiming eligibility, alter product descriptions to conceal use, or accept headline rates as contractual terms.

AllayPay's published RUO checklist additionally asks for a 21+ gate, product lab reports, registered buyers, research field/company and explicit acknowledgements; guest checkout is not acceptable for that program. The current storefront's general checkout and pen/spray catalog must be reviewed with the underwriter before applying. Do not fabricate COAs, research credentials or corporate details.

### PayPal

A custom Medusa payment provider (`apps/backend/src/modules/paypal`) using PayPal's Orders API. It stays off until `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set on the backend.

1. Create a REST app at developer.paypal.com (sandbox first). On **both** Railway Medusa services set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and `PAYPAL_ENVIRONMENT` (`sandbox` or `live`). `STOREFRONT_URL` must be the public storefront URL; PayPal sends shoppers back to `<STOREFRONT_URL>/order/paypal-return`.
2. Deploy the backend (`railway up --service medusa-server`, then `medusa-worker`).
3. Admin → **Settings → Regions**: edit every region PayPal should serve, enable `pp_paypal_paypal` and save. PayPal only supports AUD, BRL, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HUF, ILS, JPY, MXN, MYR, NOK, NZD, PHP, PLN, SEK, SGD, THB, TWD and USD, so leave it off regions in other currencies (for example AED, ISK, RON).
4. Test in sandbox with a sandbox buyer account, then switch the variables to live credentials.

Flow: the shopper approves the payment on PayPal first. On return, the storefront completes the cart; the backend checks the order with PayPal and captures the payment, so the order is created already paid. Refunds from Admin refund the PayPal capture. PayPal disputes and reviews are handled in your PayPal account.

### Countries and currencies

The storefront sells to a short list of countries for now: the United States (USD), the United Kingdom (GBP) and Germany, France and the Netherlands (EUR). The list is `SUPPORTED_COUNTRIES` in `apps/storefront/src/lib/config.ts` (override with `NEXT_PUBLIC_SUPPORTED_COUNTRIES`, comma-separated ISO codes). Every other country and region in Medusa is hidden from the country menu, checkout, URLs and the geo redirect. To add a country, add it there, and make sure it belongs to a Medusa region with prices, shipping options and legal pages ready.

- **Where a visitor lands:** `/` redirects to their saved country, else the country from Vercel's geo header, else the browser language, else `NEXT_PUBLIC_DEFAULT_COUNTRY`. The header has a panel with two dropdowns, Currency and Country; the Country list only shows the countries that use the chosen currency (a country belongs to one Medusa region, which has one currency), and Apply opens the site for that country.
- **Shipping to another country:** checkout offers every supported country. Choosing a country in another region switches the cart to that region's currency.
- **The UK is its own pound region.** An earlier change had put the UK in the euro region. Migration `vetud-markets-01-uk-pounds` moves `gb` into the GBP region (run `npx medusa exec ./src/scripts/uk-pound-region.ts` to apply only that).
- **Not translated yet.** The site is in English. Per-country languages need the interface, product pages and legal pages translated and reviewed.

### Address suggestions (optional)

Checkout and the account address book can suggest addresses as the shopper types and fill in the street, city, state, postal code and country, using Google's Places API (New). It stays off until a key is set.

1. In Google Cloud, create a project with billing, enable **Places API (New)**, and create an API key. Restrict it to **HTTP referrers** (`https://www.vetud.com/*`, plus `http://localhost:8000/*` for development) and to the Places API only.
2. In Vercel, set `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` for Production (and Preview if you want it there), then redeploy.
3. Add Google Maps Platform to the processors listed in your Privacy policy, since the address a shopper types is sent to Google.

Without the key, the address field is a normal text input. Suggestions are limited to the countries the shopper's region ships to. Parsing of Google's response is covered by `node --test tests/places.test.mjs` in `apps/storefront`.

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
- **Card payments**: add a Medusa payment provider. The checkout's payment step already lists whatever providers the region has.
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
