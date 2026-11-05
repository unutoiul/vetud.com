import { cacheLife, cacheTag } from "next/cache"
import { SUPPORTED_COUNTRIES } from "../config"
import { sdk } from "./sdk"

/**
 * Every country checkout delivers to (lower-case ISO codes), from the backend's delivery zones:
 * since 2026-11-06 the whole world. Wider than the countries the site itself is set up for
 * (SUPPORTED_COUNTRIES), which keep the language, currency default and address rules.
 */
export async function listDeliveryCountries(): Promise<string[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("delivery-countries")
  try {
    const { countries } = await sdk.client.fetch<{ countries: string[] }>("/store/delivery-countries")
    return countries.length ? countries : SUPPORTED_COUNTRIES
  } catch {
    return SUPPORTED_COUNTRIES
  }
}
