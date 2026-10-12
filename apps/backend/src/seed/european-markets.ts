import type { CreatePricesDTO, MedusaContainer, PricingRuleOperatorValues } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY, CONVERTED_MARKETS, EUROZONE_COUNTRIES } from "../lib/currencies"
import { SHIPPING } from "./catalog"

type RegionRow = {
  id: string
  currency_code: string
  metadata?: Record<string, unknown> | null
  countries?: { iso_2?: string | null }[] | null
}
type ZoneRow = { id: string; geo_zones?: { country_code?: string | null }[] | null }
type StoreRow = { id: string; supported_currencies?: { currency_code: string; is_default?: boolean }[] }
type PriceRow = {
  currency_code?: string
  amount?: unknown
  price_list_id?: string | null
  price_rules?: { attribute: string; operator?: string | null; value: string }[]
}

/** Service registered by @kb0912/currency-exchange-plugin (it ships no TypeScript types). */
type CurrencyExchangeService = {
  getExchangeRates: (base: string) => Promise<Record<string, number>>
  listCurrencyExchangeSettings: (filters: object) => Promise<{ id: string; currency_code: string }[]>
  createCurrencyExchangeSettings: (data: object[]) => Promise<unknown>
  updateCurrencyExchangeSettings: (data: object[]) => Promise<unknown>
}
const CURRENCY_EXCHANGE_MODULE = "currencyExchangeService"
const PLUGIN_PRICE_WORKFLOW = "update-prices-with-exchange-rates"

/**
 * Brings the store up to the European multi-currency setup. Idempotent, and never overwrites
 * prices or thresholds that already exist.
 *  1. Every eurozone country is in the EUR region.
 *  2. EUR is the store's default currency (the currency plugin converts from it) and every
 *     converted currency is supported.
 *  3. Each currency in CONVERTED_MARKETS has its own region.
 *  4. New countries get tax regions and join the European shipping zone.
 *  5. The currency plugin is enabled (auto rates) for each converted currency.
 *  6. European shipping options get a one-time price per currency, and every region gets a
 *     `free_shipping_threshold` in its metadata. Adjust either in Admin afterwards.
 *  7. The plugin converts all product prices once, right away.
 */
export async function ensureEuropeanMarkets(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regionData } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "metadata", "countries.iso_2"],
  })
  const regions = regionData as RegionRow[]
  const euroRegion = regions.find((region) => region.currency_code === BASE_CURRENCY)
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

  // 2. EUR is the default currency and every converted currency is supported.
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
      logger.info(`European markets: store currencies ${codes.join(", ").toUpperCase()} (default EUR).`)
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

  // 5-7 need today's rates from the currency plugin.
  const exchange = container.resolve<CurrencyExchangeService>(CURRENCY_EXCHANGE_MODULE)
  let rates: Record<string, number>
  try {
    rates = await exchange.getExchangeRates(BASE_CURRENCY)
  } catch (error) {
    logger.warn(
      `European markets: exchange rates unavailable (${(error as Error).message}). ` +
        "Run `npm run markets:setup` later to finish the currency setup."
    )
    return
  }

  // 5. Enable automatic conversion in the plugin for each converted currency.
  const settings = await exchange.listCurrencyExchangeSettings({})
  for (const { currency } of CONVERTED_MARKETS) {
    const rate = rates[currency]
    if (typeof rate !== "number") continue
    const existing = settings.find((setting) => setting.currency_code === currency)
    if (!existing) {
      await exchange.createCurrencyExchangeSettings([
        { currency_code: currency, exchange_rate: rate, mode: "auto", status: "enable" },
      ])
    }
  }

  // 6. Shipping prices and free-shipping thresholds in each converted currency.
  await addShippingPrices(container, rates)
  await addFreeShippingThresholds(container, rates)

  // 7. Convert all product prices now (the plugin's nightly job keeps them current).
  try {
    await container.resolve(Modules.WORKFLOW_ENGINE).run(PLUGIN_PRICE_WORKFLOW, { input: {} })
    logger.info("European markets: product prices converted from EUR.")
  } catch (error) {
    logger.warn(`European markets: price conversion failed (${(error as Error).message}).`)
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

/**
 * Gives every shipping option that has EUR prices a matching price in each converted currency
 * (whole units, like the plugin), including the "free over X" rule. Existing prices are kept,
 * so edits made in Admin survive. The plugin only converts product prices, not shipping.
 */
async function addShippingPrices(container: MedusaContainer, rates: Record<string, number>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)

  const { data: links } = await query.graph({
    entity: "shipping_option_price_set",
    fields: ["shipping_option_id", "price_set_id"],
  })
  const priceSetIds = (links as { price_set_id: string }[]).map((link) => link.price_set_id)
  if (!priceSetIds.length) return

  const priceSets = await pricing.listPriceSets(
    { id: priceSetIds },
    { relations: ["prices", "prices.price_rules"] }
  )

  for (const priceSet of priceSets) {
    const prices = (priceSet.prices ?? []) as PriceRow[]
    const euro = prices.filter((price) => price.currency_code === BASE_CURRENCY && !price.price_list_id)
    if (!euro.length) continue

    const toAdd: CreatePricesDTO[] = CONVERTED_MARKETS.filter(({ currency }) => rates[currency] > 0)
      .filter(({ currency }) => !prices.some((price) => price.currency_code === currency))
      .flatMap(({ currency }) =>
        euro.map((price) => {
          const rate = rates[currency]
          // Cart-total thresholds ("free over 200 EUR") are converted and rounded up.
          const rules = Object.fromEntries(
            (price.price_rules ?? []).map((rule) => [
              rule.attribute,
              [
                {
                  operator: (rule.operator ?? "eq") as PricingRuleOperatorValues,
                  value: Math.ceil(Number(rule.value) * rate),
                },
              ],
            ])
          )
          return {
            currency_code: currency,
            amount: Math.round(Number(price.amount) * rate),
            ...(Object.keys(rules).length ? { rules } : {}),
          }
        })
      )

    if (toAdd.length) {
      await pricing.addPrices({ priceSetId: priceSet.id, prices: toAdd })
    }
  }
}

/** Stores the free-shipping threshold on each region for the storefront's banner and progress bar. */
async function addFreeShippingThresholds(container: MedusaContainer, rates: Record<string, number>) {
  const regionModule = container.resolve(Modules.REGION)
  const regions = await regionModule.listRegions({}, { select: ["id", "currency_code", "metadata"] })
  const base = SHIPPING.freeShippingThreshold

  for (const region of regions) {
    if (region.metadata?.free_shipping_threshold !== undefined) continue
    const currency = region.currency_code
    const threshold =
      currency in base
        ? base[currency as keyof typeof base]
        : rates[currency] > 0
          ? Math.ceil(base.eur * rates[currency])
          : undefined
    if (threshold === undefined) continue
    await regionModule.updateRegions(region.id, {
      metadata: { ...(region.metadata ?? {}), free_shipping_threshold: threshold },
    })
  }
}
