import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createTaxRegionsWorkflow, updateRegionsWorkflow, updateServiceZonesWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY } from "../lib/currencies"
import { DROPPED_COUNTRIES, STORE_CURRENCIES, THREE_CURRENCY_REVISION, USD_MARKET } from "../lib/three-currencies"
import { syncCurrencyPrices } from "./sync-currency-prices"

type Region = { id: string; name: string; currency_code: string; metadata?: Record<string, unknown> | null; countries?: { iso_2?: string | null }[] }
type ServiceZone = { id: string; name: string; geo_zones?: { id: string; type: string; country_code: string }[] }

const codesOf = (region: Region) => (region.countries ?? []).flatMap((country) => (country.iso_2 ? [country.iso_2] : []))

/**
 * Moves Canada and Australia into the USD region and its delivery zone (Standard and Express at the
 * same USD rates), takes the dropped countries out of their regions and keeps three store currencies.
 * The emptied regions stay for the carts and orders that reference them. Safe to run again.
 */
const configureThreeCurrenciesStep = createStep(
  "configure-three-currencies",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const changes: string[] = []

    const { data: rows } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code", "metadata", "countries.iso_2"] })
    const regions = rows as Region[]
    const usd = regions.find((region) => region.currency_code === BASE_CURRENCY && codesOf(region).includes("us"))
    if (!usd) throw new MedusaError(MedusaError.Types.INVALID_DATA, "The USD region with the United States is missing.")

    // A country belongs to one region: free Canada and Australia (and the dropped countries) first.
    const moving = new Set([...USD_MARKET.countries, ...DROPPED_COUNTRIES])
    for (const region of regions.filter((item) => item.id !== usd.id)) {
      const current = codesOf(region)
      const remaining = current.filter((code) => !moving.has(code))
      if (remaining.length === current.length) continue
      await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { countries: remaining } } })
      changes.push(`${region.name}: ${current.filter((code) => moving.has(code)).join(", ")} removed`)
    }
    const countries = [...new Set([...codesOf(usd), ...USD_MARKET.countries])]
    if (countries.length !== codesOf(usd).length || usd.name !== USD_MARKET.name || usd.metadata?.three_currency_revision !== THREE_CURRENCY_REVISION) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: usd.id }, update: { name: USD_MARKET.name, countries, metadata: { ...usd.metadata, three_currency_revision: THREE_CURRENCY_REVISION } } },
      })
      changes.push(`${USD_MARKET.name}: ${countries.join(", ")}`)
    }

    // Delivery: the zone that ships to the United States also ships to Canada and Australia.
    const { data: zones } = await query.graph({ entity: "service_zone", fields: ["id", "name", "geo_zones.id", "geo_zones.type", "geo_zones.country_code"] })
    const zone = (zones as ServiceZone[]).find((item) => item.geo_zones?.some((geo) => geo.type === "country" && geo.country_code === "us"))
    if (!zone) throw new MedusaError(MedusaError.Types.INVALID_DATA, "No delivery zone ships to the United States.")
    const served = new Set((zone.geo_zones ?? []).map((geo) => geo.country_code))
    const added = USD_MARKET.countries.filter((code) => !served.has(code))
    if (added.length || zone.name !== USD_MARKET.name) {
      await updateServiceZonesWorkflow(container).run({
        input: {
          selector: { id: zone.id },
          update: { name: USD_MARKET.name, geo_zones: [...(zone.geo_zones ?? []).map((geo) => ({ id: geo.id })), ...added.map((country_code) => ({ type: "country" as const, country_code }))] },
        },
      })
      changes.push(`Delivery zone ${USD_MARKET.name}: ${added.join(", ") || "renamed"}`)
    }

    // Tax regions like the other destinations' (system provider, no rates).
    const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["country_code"] })
    const taxed = new Set(taxRegions.map((region) => region.country_code))
    const untaxed = USD_MARKET.countries.filter((code) => !taxed.has(code))
    if (untaxed.length) {
      await createTaxRegionsWorkflow(container).run({ input: untaxed.map((country_code) => ({ country_code, provider_id: "tp_system" })) })
      changes.push(`Tax regions: ${untaxed.join(", ")}`)
    }

    const { data: stores } = await query.graph({ entity: "store", fields: ["id", "supported_currencies.currency_code"] })
    const store = stores[0]
    if (!store) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Missing store.")
    const supported = (store.supported_currencies ?? []).flatMap((currency) => (currency?.currency_code ? [currency.currency_code] : []))
    if (supported.length !== STORE_CURRENCIES.length || !STORE_CURRENCIES.every((code) => supported.includes(code))) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { supported_currencies: STORE_CURRENCIES.map((currency_code) => ({ currency_code, is_default: currency_code === BASE_CURRENCY })) } },
      })
      changes.push(`Store currencies: ${STORE_CURRENCIES.join(", ")}`)
    }

    // Shipping prices follow the zones: the old CAD and AUD ones go, USD covers the new countries.
    const { removed } = await syncCurrencyPrices(container)
    logger.info(`Three currencies: ${changes.length ? changes.join("; ") : "already configured"}${removed ? `; ${removed} shipping prices removed` : ""}.`)
    return new StepResponse({ changes })
  },
)

export const configureThreeCurrenciesWorkflow = createWorkflow(
  "configure-three-currencies",
  (input: Record<string, never>) => new WorkflowResponse(configureThreeCurrenciesStep(input)),
)
