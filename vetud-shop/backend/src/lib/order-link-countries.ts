import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BASE_CURRENCY } from "./currencies"
import { listDeliveryCountries } from "./delivery-countries"

export type OrderLinkRegion = {
  id: string
  currency_code: string | null
  countries?: { iso_2?: string | null; display_name?: string | null }[] | null
  payment_providers?: ({ id?: string | null; is_enabled?: boolean | null } | null)[] | null
}

/** One country the owner can make an order link for. */
export type OrderLinkCountry = {
  code: string
  name: string
  region_id: string
  currency_code: string | null
  /** The shop address the link opens (/<store_country>/order-link): the country itself, or "us" for the rest of the world. */
  store_country: string
  payment_providers: string[]
}

const REGION_FIELDS = ["id", "currency_code", "countries.iso_2", "countries.display_name", "payment_providers.id", "payment_providers.is_enabled"]

/**
 * Every country an order link can go to (owner, 2026-11-25): the countries of the shop's regions in
 * their own currency, and every other country the shop delivers to (the rest of the world, since
 * 2026-11-06) in US dollars, through the US dollar region and the /us shop. Delivery to those
 * countries already works at checkout; only the currency comes from the region.
 */
export async function listOrderLinkCountries(container: MedusaContainer): Promise<OrderLinkCountry[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: regionRows }, { data: countryRows }, delivered] = await Promise.all([
    query.graph({ entity: "region", fields: REGION_FIELDS }),
    query.graph({ entity: "country", fields: ["iso_2", "display_name"] }),
    listDeliveryCountries(container),
  ])
  const regions = regionRows as OrderLinkRegion[]
  const providersOf = (region: OrderLinkRegion) =>
    (region.payment_providers ?? []).flatMap((provider) => (provider?.id && provider.is_enabled !== false ? [provider.id] : []))

  const result = new Map<string, OrderLinkCountry>()
  for (const region of regions) {
    for (const country of region.countries ?? []) {
      const code = country.iso_2?.toLowerCase()
      if (!code) continue
      result.set(code, {
        code,
        name: country.display_name ?? code.toUpperCase(),
        region_id: region.id,
        currency_code: region.currency_code ?? null,
        store_country: code,
        payment_providers: providersOf(region),
      })
    }
  }

  const dollar = regions.find((region) => region.currency_code === BASE_CURRENCY && region.countries?.some((country) => country.iso_2 === "us"))
    ?? regions.find((region) => region.currency_code === BASE_CURRENCY)
  if (dollar) {
    const storeCountry = dollar.countries?.some((country) => country.iso_2 === "us") ? "us" : (dollar.countries?.[0]?.iso_2 ?? "us")
    const names = new Map((countryRows as { iso_2?: string | null; display_name?: string | null }[]).map((country) => [country.iso_2?.toLowerCase(), country.display_name]))
    for (const code of delivered) {
      if (result.has(code)) continue
      result.set(code, {
        code,
        name: names.get(code) ?? code.toUpperCase(),
        region_id: dollar.id,
        currency_code: dollar.currency_code ?? null,
        store_country: storeCountry,
        payment_providers: providersOf(dollar),
      })
    }
  }

  return [...result.values()].sort((a, b) => a.name.localeCompare(b.name))
}
