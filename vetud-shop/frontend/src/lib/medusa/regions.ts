import type { HttpTypes } from "@medusajs/types"
import { cacheLife, cacheTag } from "next/cache"
import { FALLBACK_COUNTRIES, SUPPORTED_COUNTRIES } from "../config"
import { sdk } from "./sdk"

export type CountryOption = {
  code: string
  name: string
  currencyCode: string
  regionId: string
}

export async function listRegions(): Promise<HttpTypes.StoreRegion[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("regions")

  const { regions } = await sdk.store.region.list({ fields: "id,name,currency_code,metadata,*countries" })
  // Only the countries we sell to for now; regions left with no country disappear.
  return regions
    .map((region) => ({
      ...region,
      countries: (region.countries ?? []).filter((country) => SUPPORTED_COUNTRIES.includes((country.iso_2 ?? "").toLowerCase())),
    }))
    .filter((region) => region.countries.length > 0)
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

/** The region that prices in a currency (each of USD, EUR and GBP has one). */
export async function getRegionForCurrency(currency: string): Promise<HttpTypes.StoreRegion | null> {
  const regions = await listRegions()
  return regions.find((region) => region.currency_code.toLowerCase() === currency.toLowerCase()) ?? null
}

/** The region for a page: the shopper's chosen currency, else the country's own. */
export async function getStoreRegion(country: string, currency: string | null) {
  return (currency ? await getRegionForCurrency(currency) : null) ?? (await getRegionForCountry(country)) ?? (await listRegions())[0] ?? null
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
