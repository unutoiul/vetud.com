# AGENTS.md (education backend)

Medusa 2.21 application for the education site: community, article comments, member accounts and the email list. It has no catalog, orders or payments, and it shares no database or code with `vetud-shop`.

- npm is the package manager (`package-lock.json`); never add another lockfile.
- Run `npm run lint` and `npx tsc --noEmit` after changes. Fix lint errors; never disable a rule.
- Style: no semicolons, double quotes, 2-space indent, kebab-case file names.
- Business logic goes in workflows (`src/workflows`); routes and subscribers only run workflows.
- API routes are file-based: `src/api/store/<path>/route.ts`. Body validation is registered in `src/api/middlewares.ts` and `src/api/forum-middlewares.ts`.
- Custom module model changes need `npx medusa db:generate <module>`; never edit existing migrations.
- Keep the community free of doses: posts matching dose patterns are held for review (`src/lib/forum/moderation.ts`).
- Do not commit `.env`; document new variables in `.env.template`.

Local: `docker compose up -d` from `vetud-education/` (Postgres on 5433, Redis on 6380), copy `.env.template` to `.env`, then `npx medusa db:migrate` and `npm run dev` (port 9100). `npx medusa user -e <email> -p <password>` creates an Admin login.
