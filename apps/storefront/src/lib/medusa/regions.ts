import type { HttpTypes } from "@medusajs/types"
import { cacheLife, cacheTag } from "next/cache"
import { FALLBACK_COUNTRIES } from "../config"
import { sdk } from "./sdk"

export type CountryOption = {
  code: string
  name: string
  currencyCode: string
  regionId: string
}

export async function listRegions(): Promise<HttpTypes.StoreRegion[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("regions")

  const { regions } = await sdk.store.region.list({ fields: "id,name,currency_code,*countries" })
  return regions
}

export async function getRegionForCountry(
  countryCode: string
): Promise<HttpTypes.StoreRegion | null> {
  const regions = await listRegions()
  return (
    regions.find((region) =>
      region.countries?.some((country) => country.iso_2 === countryCode.toLowerCase())
    ) ?? null
  )
}

/** Every country the store sells to, for the country selector and checkout. */
export async function listCountryOptions(): Promise<CountryOption[]> {
  const regions = await listRegions()
  return regions
    .flatMap((region) =>
      (region.countries ?? []).map((country) => ({
        code: country.iso_2 ?? "",
        name: country.display_name ?? country.name ?? (country.iso_2 ?? "").toUpperCase(),
        currencyCode: region.currency_code,
        regionId: region.id,
      }))
    )
    .filter((country) => country.code)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Country codes for build-time params. Falls back to the static list if Medusa is unreachable. */
export async function listCountryCodes(): Promise<string[]> {
  try {
    const countries = await listCountryOptions()
    return countries.length ? countries.map((country) => country.code) : FALLBACK_COUNTRIES
  } catch {
    return FALLBACK_COUNTRIES
  }
}
