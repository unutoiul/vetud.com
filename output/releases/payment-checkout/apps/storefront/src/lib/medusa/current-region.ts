import "server-only"
import { countryCode } from "next/root-params"
import { getRegionForCountry, listRegions } from "./regions"

/** The country from the URL and its Medusa region. Server Components only. */
export async function getCurrentRegion() {
  const code = await countryCode()
  const region = (await getRegionForCountry(code)) ?? (await listRegions())[0]
  if (!region) {
    throw new Error("No regions found. Is the Medusa backend running and seeded?")
  }
  return { countryCode: code, region }
}
