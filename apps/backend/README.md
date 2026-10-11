# Vetud backend (Medusa 2.21)

Commerce API, Admin dashboard (`/app`), search indexing and transactional email for Vetud Peptides.
Setup, environment variables and deployment are documented in the [root README](../../README.md).

| Path | What it is |
|---|---|
| `medusa-config.ts` | Modules: Meilisearch search, Resend (or console) notifications, Redis infrastructure when `REDIS_URL` is set |
| `src/seed/` | Placeholder catalog (`catalog.ts`) and the seed logic; runs once via `src/migration-scripts/` |
| `src/search/products.ts` | Meilisearch product index (adds product code and lot numbers) |
| `src/modules/resend/` | Resend notification provider and react-email templates |
| `src/subscribers/`, `src/workflows/` | `order.placed` and `shipment.created` emails, contact-form workflow |
| `src/api/store/contact/` | `POST /store/contact` (validated, honeypot-protected) |
| `src/lib/lots.ts` | Parser for the `lots` product metadata format |
| `railway.*.json` | Railway config for the server and worker services |
