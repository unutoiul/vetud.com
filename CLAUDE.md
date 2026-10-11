# CLAUDE.md

Vetud Peptides store. See README.md for setup, deployment and how the store works.

- `apps/backend`: Medusa 2.21 (TypeScript). Read `apps/backend/AGENTS.md` before backend work.
- `apps/storefront`: Next.js 16 with Cache Components + MUI 9 (Emotion). Read `apps/storefront/AGENTS.md`; Next 16 APIs differ from older versions, and the bundled docs live in `apps/storefront/node_modules/next/dist/docs/`.
- The apps are independent npm projects (no workspaces): install and run commands inside each app.
- Local infra: `docker compose up -d` (Postgres, Redis, Meilisearch).

Storefront rules that the build enforces:
- Catalog data comes from `'use cache'` functions in `src/lib/medusa/` keyed by region id. Never read cookies/headers/searchParams inside them.
- Anything reading `params`, `searchParams` or URL hooks (`useSearchParams`, `usePathname`) must sit inside `<Suspense>`. Internal links get the country prefix from the store context (`components/common/links.tsx`), not from URL hooks.
- Cart and checkout are client-side via the Medusa JS SDK (`StoreProvider`).
- Verify with `npm run lint`, `npm run typecheck` and `npm run build` (the build needs the backend running).
