# Vetud storefront (Next.js 16 + MUI 9)

Setup and deployment are documented in the [root README](../../README.md).

| Path | What it is |
|---|---|
| `src/app/[countryCode]/` | All pages. The country segment selects the Medusa region and currency (`next/root-params`) |
| `src/proxy.ts` | Redirects requests without a valid country segment |
| `src/theme/` | Pep Lab MUI theme (`pep-lab.ts`), tokens and the Emotion SSR registry |
| `src/lib/medusa/` | Cached server data fetchers (`'use cache'` + `cacheLife`/`cacheTag`) and the JS SDK client |
| `src/components/store/StoreProvider.tsx` | Client cart state (Medusa JS SDK, cart id in localStorage) |
| `src/components/checkout/` | 4-step checkout and order confirmation |
| `src/content/legal.ts` | Legal page templates (placeholders to replace) |
| `src/lib/config.ts` | Site constants: email, free-shipping thresholds, fallback countries |
