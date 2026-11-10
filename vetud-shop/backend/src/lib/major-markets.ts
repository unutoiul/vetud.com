import { CONVERTED_MARKETS, EUROZONE_COUNTRIES } from "./currencies"

export const MAJOR_MARKET_REVISION = "major-world-currencies-2026-10-13-v1"

/** Consolidate the European destinations the store already serves into EUR. */
export const EUROPEAN_EUR_COUNTRIES = [
  ...EUROZONE_COUNTRIES,
  ...CONVERTED_MARKETS.flatMap((market) => market.countries),
]

export const WORLD_MARKETS = [
  { currency: "cad", name: "Canada", countries: ["ca"] },
  { currency: "aud", name: "Australia", countries: ["au"] },
  { currency: "jpy", name: "Japan", countries: ["jp"] },
  { currency: "cny", name: "China", countries: ["cn"] },
  { currency: "sgd", name: "Singapore", countries: ["sg"] },
  { currency: "hkd", name: "Hong Kong", countries: ["hk"] },
  { currency: "aed", name: "United Arab Emirates", countries: ["ae"] },
]

export const MAJOR_CURRENCIES = [
  "eur",
  "usd",
  ...WORLD_MARKETS.map((market) => market.currency),
]
