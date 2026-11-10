# CLAUDE.md

This repository holds two separate VETUD projects. They share no database, no accounts and no code; shared-looking files were copied once and each project owns its copy. See README.md for setup, deployment and how the store works.

**`vetud-shop/`** is the store (moving to its own domain):
- `vetud-shop/backend`: Medusa 2.21 (TypeScript). Read `vetud-shop/backend/AGENTS.md` before backend work.
- `vetud-shop/frontend`: Next.js 16 with Cache Components + MUI 9 (Emotion). Read `vetud-shop/frontend/AGENTS.md`; Next 16 APIs differ from older versions, and the bundled docs live in `vetud-shop/frontend/node_modules/next/dist/docs/`.
- Local infra: `docker compose up -d` from `vetud-shop/` (Postgres, Redis, Meilisearch).

**`vetud-education/`** is the learning site, news, videos and community (www.vetud.com):
- `vetud-education/backend`: a second Medusa 2.21, for accounts, the forum, comments and the email list only. Read `vetud-education/backend/AGENTS.md`.
- `vetud-education/frontend`: Next.js 16 + MUI 9, with addresses by language (`/en`, `/fr`), not by country. Languages are listed in `src/i18n/languages.ts`.
- Local infra: `docker compose up -d` from `vetud-education/` (Postgres on 5433, Redis on 6380). Backend on port 9100, frontend on 8100.

Each app is an independent npm project (no workspaces): install and run commands inside it.

Frontend rules that the build enforces:
- Shop catalog data comes from `'use cache'` functions in `src/lib/medusa/` keyed by region id. Never read cookies/headers/searchParams inside them.
- Anything reading `params`, `searchParams` or URL hooks (`useSearchParams`, `usePathname`) must sit inside `<Suspense>`. Internal links get their prefix (country in the shop, language in education) from context (`components/common/links.tsx`), not from URL hooks.
- Cart and checkout are client-side via the Medusa JS SDK (`StoreProvider`).
- Verify with `npm run lint`, `npm run typecheck` and `npm run build` (the build needs that project's backend running).
