import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createRegionsWorkflow, updateRegionsWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY } from "../lib/currencies"
import { EUROPEAN_EUR_COUNTRIES, MAJOR_CURRENCIES, MAJOR_MARKET_REVISION, WORLD_MARKETS } from "../lib/major-markets"
import { syncCurrencyPrices } from "./sync-currency-prices"

type Region = {
  id: string
  name: string
  currency_code: string
  metadata?: Record<string, unknown> | null
  countries?: { iso_2?: string | null }[]
}

const codesOf = (region: Region) => (region.countries ?? []).map((country) => country.iso_2!).filter(Boolean)

const configureMajorMarketsStep = createStep(
  "configure-major-markets",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const { data: rows } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code", "metadata", "countries.iso_2"] })
    const regions = rows as Region[]
    const euro = regions.find((region) => region.currency_code === "eur" && region.countries?.length)
    if (!euro || !regions.some((region) => region.currency_code === BASE_CURRENCY))
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Existing EUR and USD markets are required.")
    for (const market of WORLD_MARKETS) {
      for (const code of market.countries) {
        const owner = regions.find((region) => codesOf(region).includes(code))
        if (owner && owner.currency_code !== market.currency)
          throw new MedusaError(MedusaError.Types.INVALID_DATA, `${code.toUpperCase()} is assigned to another currency; review its market before changing it.`)
      }
    }

    const { data: stores } = await query.graph({ entity: "store", fields: ["id", "supported_currencies.currency_code"] })
    const store = stores[0]
    if (!store) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Missing store.")
    const supported = (store.supported_currencies ?? []).flatMap((currency) => (currency?.currency_code ? [currency.currency_code] : []))
    const codes = [...new Set([...supported, ...MAJOR_CURRENCIES])]
    if (codes.length !== supported.length) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { supported_currencies: codes.map((currency_code) => ({ currency_code, is_default: currency_code === BASE_CURRENCY })) } },
      })
    }

    // Keep legacy regions for historical carts/orders; move their European destinations into the existing EUR region.
    const european = new Set(EUROPEAN_EUR_COUNTRIES)
    for (const region of regions.filter((region) => region.id !== euro.id)) {
      const current = codesOf(region)
      const remaining = current.filter((code) => !european.has(code))
      if (remaining.length !== current.length)
        await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { countries: remaining } } })
    }
    const euroCountries = [...new Set([...codesOf(euro), ...EUROPEAN_EUR_COUNTRIES])]
    if (euroCountries.length !== euro.countries?.length || euro.metadata?.major_market_revision !== MAJOR_MARKET_REVISION) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: euro.id }, update: { name: "Europe", countries: euroCountries, metadata: { ...euro.metadata, major_market_revision: MAJOR_MARKET_REVISION } } },
      })
    }
    for (const market of WORLD_MARKETS) {
      const existing = regions.find((region) => region.currency_code === market.currency)
      if (!existing) {
        await createRegionsWorkflow(container).run({
          input: { regions: [{ name: market.name, currency_code: market.currency, countries: market.countries, payment_providers: ["pp_system_default"], metadata: { major_market_revision: MAJOR_MARKET_REVISION } }] },
        })
      } else {
        const countries = [...new Set([...codesOf(existing), ...market.countries])]
        if (countries.length !== codesOf(existing).length)
          await updateRegionsWorkflow(container).run({ input: { selector: { id: existing.id }, update: { countries } } })
      }
    }

    // Prices in the new currencies, from USD.
    const { created } = await syncCurrencyPrices(container)
    logger.info(`Major markets configured: ${MAJOR_CURRENCIES.join(", ").toUpperCase()}; ${created} prices added.`)
    return new StepResponse({ currencies: MAJOR_CURRENCIES, pricesAdded: created })
  },
)

/** Consolidates European pricing and adds the main global currencies without extending delivery zones. */
export const configureMajorMarketsWorkflow = createWorkflow(
  "configure-major-markets",
  (input: Record<string, never>) => new WorkflowResponse(configureMajorMarketsStep(input)),
)
