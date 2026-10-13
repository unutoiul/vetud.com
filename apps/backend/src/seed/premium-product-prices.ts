/** User-selected 100% retail increase. Rates match the store currency plugin's feed. */
export const PREMIUM_PRICE_REVISION = "double-retail-all-markets-2026-10-13-v1"
export const PREMIUM_PRICE_MULTIPLIER = 2
export const PREMIUM_PRICE_HANDLES = [
  "retatrutide",
  "semaglutide",
  "tirzepatide",
]
export const PREMIUM_FX_DATE = "2026-10-13"
export const PREMIUM_FX_SOURCE =
  "https://latest.currency-api.pages.dev/v1/currencies/eur.json"
export const PREMIUM_EUR_RATES: Record<string, number> = {
  eur: 1,
  usd: 1.11751153,
  gbp: 0.84520585,
  chf: 0.93093866,
  sek: 11.20040451,
  nok: 10.69683298,
  dkk: 7.47515463,
  pln: 4.38666401,
  czk: 24.37137217,
  huf: 364.882647,
  ron: 5.3344448,
  isk: 136.20036087,
}
