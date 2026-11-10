import "server-only"
import { countryCode } from "next/root-params"
import { parseStoreSegment } from "../store-segment"
import { getStoreRegion } from "./regions"

/**
 * The country from the URL and the region of the shopper's currency (the country's own unless the
 * proxy rewrote to a currency segment, see store-segment.ts). Server Components only.
 */
export async function getCurrentRegion() {
  const { country, currency } = parseStoreSegment(await countryCode())
  const region = await getStoreRegion(country, currency)
  if (!region) {
    throw new Error("No regions found. Is the Medusa backend running and seeded?")
  }
  return { countryCode: country, region }
}
