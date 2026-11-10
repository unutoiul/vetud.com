# VETUD education frontend

The learning site: guides, news, videos and the community. Next.js 16 with Cache Components and MUI 9. It talks only to `vetud-education/backend`.

## Run it locally

```bash
# From vetud-education/: database and Redis
docker compose up -d

# From vetud-education/backend/ (first run: cp .env.template .env, npm install, npx medusa db:migrate)
npm run dev        # http://localhost:9100/app

# From this folder (first run: cp .env.example .env.local, paste the publishable key, npm install)
npm run dev        # http://localhost:8100
```

Check changes with `npm run lint`, `npm run typecheck` and `npm run build` (the build needs the backend running).

## How addresses work

- Every page lives under its language: `/en/learn`, `/fr/learn`. The list is in `src/i18n/languages.ts`. Add a language only when its pages are fully translated and checked by a person.
- The site doesn't depend on the visitor's country. Old country addresses (`/gb/learn`, `/de/shop`) are redirected by the rules in `src/i18n/old-addresses.ts`.
- Internal links get the language from `components/common/links.tsx`.

## The shop

The shop is a separate site, and this site doesn't link to it: no Shop menu item and no product links in guides. `NEXT_PUBLIC_SHOP_URL` is still used for two things: the shop's name in the legal pages, and redirecting old vetud.com shop addresses (orders, product images) to the shop.

## Before launch

- Set `INDEXING_ENABLED=true`. Until then every page answers `noindex`.
- About 48 hours after launch, set `REDIRECTS_PERMANENT=true`.
- `src/content/legal.ts` holds drafts with `[bracketed placeholders]`. They need filling in and a lawyer's review.
- The French in `src/i18n/content/fr.json` was machine-prepared and needs a person's check, especially the medical wording. `scripts/export-translation-review.mjs` writes it to a spreadsheet for that.

## Translations

Page text goes through `ct()` and is looked up in `src/i18n/content/<language>.json`. Every build runs `npm run check:i18n`, which fails if a published language is missing any string, and records in `client-keys.json` which strings the browser needs.
