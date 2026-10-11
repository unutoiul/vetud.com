# AGENTS.md (backend)

Medusa 2.21 application. npm is the package manager (`package-lock.json`); never add another lockfile.

- Run `npm run lint` and `npx tsc --noEmit` after changes. The `@medusajs/eslint-plugin` rules encode framework requirements (e.g. no throwing inside `transform()`); fix the code, never disable a rule.
- Style: no semicolons, double quotes, 2-space indent, kebab-case file names.
- Business logic goes in workflows (`src/workflows`); routes and subscribers only run workflows.
- API routes are file-based: `src/api/store/<path>/route.ts`. Body validation is registered in `src/api/middlewares.ts`.
- Product metadata keys used by the storefront: `code`, `accent`, `purity`, `form`, `storage`, `lots` (see `src/lib/lots.ts`).
- Adding fields to search: edit `src/search/products.ts`; the Search Module reindexes on boot when the declaration changes.
- Custom module model changes need `npx medusa db:generate <module>`; never edit existing migrations.
- Do not commit `.env`; document new variables in `.env.template`.
