import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY, CONVERTED_MARKETS, EUROZONE_COUNTRIES } from "../lib/currencies"
import { syncCurrencyPrices } from "../workflows/sync-currency-prices"

type RegionRow = {
  id: string
  currency_code: string
  metadata?: Record<string, unknown> | null
  countries?: { iso_2?: string | null }[] | null
}
type ZoneRow = { id: string; geo_zones?: { country_code?: string | null }[] | null }
type StoreRow = { id: string; supported_currencies?: { currency_code: string; is_default?: boolean }[] }

/**
 * Brings the store up to the European multi-currency setup. Idempotent.
 *  1. Every eurozone country is in the EUR region.
 *  2. USD is the store's default currency and every converted currency is supported.
 *  3. Each currency in CONVERTED_MARKETS has its own region.
 *  4. New countries get tax regions and join the European shipping zone.
 *  5. Prices in the new currencies are converted from USD (workflows/sync-currency-prices.ts).
 */
export async function ensureEuropeanMarkets(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regionData } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "metadata", "countries.iso_2"],
  })
  const regions = regionData as RegionRow[]
  const euroRegion = regions.find((region) => region.currency_code === "eur")
  if (!euroRegion) {
    logger.info("European markets: no EUR region yet (store not seeded), skipping.")
    return
  }

  const assigned = new Set(
    regions.flatMap((region) => (region.countries ?? []).map((country) => country.iso_2 ?? ""))
  )
  const addedCountries: string[] = []

  // 1. Every eurozone country pays in EUR.
  const missingEuro = EUROZONE_COUNTRIES.filter((code) => !assigned.has(code))
  if (missingEuro.length) {
    const current = (euroRegion.countries ?? []).map((country) => country.iso_2!).filter(Boolean)
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: euroRegion.id }, update: { countries: [...current, ...missingEuro] } },
    })
    missingEuro.forEach((code) => assigned.add(code))
    addedCountries.push(...missingEuro)
    logger.info(`European markets: added ${missingEuro.join(", ")} to the EUR region.`)
  }

  // 2. USD is the default currency and every converted currency is supported.
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const store = stores[0] as StoreRow | undefined
  if (store) {
    const supported = store.supported_currencies ?? []
    const codes = Array.from(
      new Set([...supported.map((currency) => currency.currency_code), ...CONVERTED_MARKETS.map((market) => market.currency)])
    )
    const defaultCode = supported.find((currency) => currency.is_default)?.currency_code
    if (codes.length !== supported.length || defaultCode !== BASE_CURRENCY) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            supported_currencies: codes.map((currency_code) => ({
              currency_code,
              is_default: currency_code === BASE_CURRENCY,
            })),
          },
        },
      })
      logger.info(`European markets: store currencies ${codes.join(", ").toUpperCase()} (default USD).`)
    }
  }

  // 3. One region per converted currency.
  const haveCurrency = new Set(regions.map((region) => region.currency_code))
  const newRegions = CONVERTED_MARKETS.filter((market) => !haveCurrency.has(market.currency))
    .map((market) => ({ ...market, countries: market.countries.filter((code) => !assigned.has(code)) }))
    .filter((market) => market.countries.length)
  if (newRegions.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: newRegions.map((market) => ({
          name: market.region,
          currency_code: market.currency,
          countries: market.countries,
          payment_providers: ["pp_system_default"],
        })),
      },
    })
    newRegions.forEach((market) => addedCountries.push(...market.countries))
    logger.info(`European markets: created regions ${newRegions.map((market) => market.region).join(", ")}.`)
  }

  // 4. Tax regions and shipping zone for the new countries.
  if (addedCountries.length) {
    const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["country_code"] })
    const taxed = new Set((taxRegions as { country_code?: string }[]).map((tax) => tax.country_code))
    const untaxed = addedCountries.filter((code) => !taxed.has(code))
    if (untaxed.length) {
      // No default rate: set real rates in Admin > Settings > Tax Regions.
      await createTaxRegionsWorkflow(container).run({
        input: untaxed.map((country_code) => ({ country_code, provider_id: "tp_system" })),
      })
    }

    const europeZone = await findEuropeZone(container, euroRegion)
    const { data: zoneData } = await query.graph({ entity: "service_zone", fields: ["id", "geo_zones.country_code"] })
    const zoned = new Set(
      (zoneData as ZoneRow[]).flatMap((zone) => (zone.geo_zones ?? []).map((geo) => geo.country_code))
    )
    const unzoned = addedCountries.filter((code) => !zoned.has(code))
    if (europeZone && unzoned.length) {
      await container.resolve(Modules.FULFILLMENT).createGeoZones(
        unzoned.map((country_code) => ({ service_zone_id: europeZone.id, type: "country" as const, country_code }))
      )
      logger.info(`European markets: shipping zone now covers ${unzoned.join(", ")}.`)
    }
  }

  // 5. Prices in every currency, from USD. If the rates are unavailable, the hourly job catches up.
  try {
    await syncCurrencyPrices(container)
  } catch (error) {
    logger.warn(`European markets: prices not converted yet (${(error as Error).message}).`)
  }
}

async function findEuropeZone(container: MedusaContainer, euroRegion: RegionRow) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "service_zone", fields: ["id", "geo_zones.country_code"] })
  const euroCountries = new Set((euroRegion.countries ?? []).map((country) => country.iso_2))
  return (data as ZoneRow[]).find((zone) =>
    (zone.geo_zones ?? []).some((geo) => euroCountries.has(geo.country_code))
  )
}
