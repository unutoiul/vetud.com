import type { CreatePricesDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRegionsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { CONVERTED_CURRENCIES } from "../lib/currencies"
import {
  EUROPEAN_EUR_COUNTRIES,
  MAJOR_CURRENCIES,
  MAJOR_MARKET_REVISION,
  WORLD_MARKETS,
} from "../lib/major-markets"

type ExchangeService = {
  getExchangeRates: (base: string) => Promise<Record<string, number>>
  listCurrencyExchangeSettings: (
    filters: object,
  ) => Promise<{ id: string; currency_code: string; status: string }[]>
  createCurrencyExchangeSettings: (data: object[]) => Promise<unknown>
  updateCurrencyExchangeSettings: (data: object[]) => Promise<unknown>
}
type Price = {
  currency_code: string
  amount: number
  price_list_id?: string | null
  min_quantity?: number | null
  max_quantity?: number | null
  rules_count?: number
  price_rules?: unknown[]
}
type Product = {
  handle: string
  variants: { title: string; price_set?: { id: string; prices: Price[] } }[]
}
type Region = {
  id: string
  name: string
  currency_code: string
  metadata?: Record<string, unknown> | null
  countries?: { iso_2?: string | null }[]
}

const configureMajorMarketsStep = createStep(
  "configure-major-markets",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const exchange = container.resolve<ExchangeService>(
      "currencyExchangeService",
    )
    const pricing = container.resolve(Modules.PRICING)
    const { data: rows } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code", "metadata", "countries.iso_2"],
    })
    const regions = rows as Region[]
    const euro = regions.find(
      (region) => region.currency_code === "eur" && region.countries?.length,
    )
    if (!euro || !regions.some((region) => region.currency_code === "usd"))
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Existing EUR and USD markets are required.",
      )
    const rates = await exchange.getExchangeRates("eur")
    for (const market of WORLD_MARKETS) {
      if (
        !Number.isFinite(rates[market.currency]) ||
        !(rates[market.currency] > 0)
      )
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Missing rate for ${market.currency.toUpperCase()}.`,
        )
      for (const code of market.countries) {
        const owner = regions.find((region) =>
          region.countries?.some((country) => country.iso_2 === code),
        )
        if (owner && owner.currency_code !== market.currency)
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `${code.toUpperCase()} is assigned to another currency; review its market before changing it.`,
          )
      }
    }
    const { data: stores } = await query.graph({
      entity: "store",
      fields: [
        "id",
        "supported_currencies.currency_code",
        "supported_currencies.is_default",
      ],
    })
    const store = stores[0]
    if (!store)
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Missing store.")
    const { data: productRows } = await query.graph({
      entity: "product",
      fields: [
        "handle",
        "variants.title",
        "variants.price_set.id",
        "variants.price_set.prices.*",
        "variants.price_set.prices.price_rules.*",
      ],
      filters: { status: "published" },
    })
    const additions: { priceSetId: string; prices: CreatePricesDTO[] }[] = []
    for (const product of productRows as unknown as Product[]) {
      for (const variant of product.variants) {
        const priceSet = variant.price_set
        const base =
          priceSet?.prices.filter(
            (price) =>
              price.currency_code === "eur" &&
              !price.price_list_id &&
              !price.rules_count &&
              !price.price_rules?.length &&
              price.min_quantity == null &&
              price.max_quantity == null,
          ) ?? []
        if (!priceSet || base.length !== 1 || !(Number(base[0].amount) > 0))
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `${product.handle} ${variant.title} needs one positive base EUR price.`,
          )
        // Add only missing prices. Approved USD/EUR tiers and all historical currencies keep their IDs and values.
        const prices = WORLD_MARKETS.filter(
          (market) =>
            !priceSet.prices.some(
              (price) => price.currency_code === market.currency,
            ),
        ).map((market) => ({
          currency_code: market.currency,
          amount: Math.round(Number(base[0].amount) * rates[market.currency]),
        }))
        if (prices.length) additions.push({ priceSetId: priceSet.id, prices })
      }
    }

    // All validation and exchange-rate reads happen before the first mutation.
    for (const addition of additions) await pricing.addPrices(addition)
    const codes = [
      ...new Set([
        ...(store.supported_currencies ?? []).flatMap((currency) =>
          currency?.currency_code ? [currency.currency_code] : [],
        ),
        ...MAJOR_CURRENCIES,
      ]),
    ]
    if (codes.length !== store.supported_currencies?.length) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            supported_currencies: codes.map((currency_code) => ({
              currency_code,
              is_default: currency_code === "eur",
            })),
          },
        },
      })
    }
    const settings = await exchange.listCurrencyExchangeSettings({})
    const disabled = settings.filter(
      (setting) =>
        CONVERTED_CURRENCIES.includes(setting.currency_code) &&
        setting.status !== "disable",
    )
    if (disabled.length)
      await exchange.updateCurrencyExchangeSettings(
        disabled.map((setting) => ({ id: setting.id, status: "disable" })),
      )
    for (const market of WORLD_MARKETS) {
      const existing = settings.find(
        (setting) => setting.currency_code === market.currency,
      )
      if (!existing)
        await exchange.createCurrencyExchangeSettings([
          {
            currency_code: market.currency,
            exchange_rate: rates[market.currency],
            mode: "auto",
            status: "enable",
          },
        ])
    }

    // Keep legacy regions for historical carts/orders; move their European destinations into the existing EUR region.
    const european = new Set(EUROPEAN_EUR_COUNTRIES)
    for (const region of regions.filter((region) => region.id !== euro.id)) {
      const current = (region.countries ?? [])
        .map((country) => country.iso_2!)
        .filter(Boolean)
      const remaining = current.filter((code) => !european.has(code))
      if (remaining.length !== current.length)
        await updateRegionsWorkflow(container).run({
          input: {
            selector: { id: region.id },
            update: { countries: remaining },
          },
        })
    }
    const euroCountries = [
      ...new Set([
        ...(euro.countries ?? [])
          .map((country) => country.iso_2!)
          .filter(Boolean),
        ...EUROPEAN_EUR_COUNTRIES,
      ]),
    ]
    if (
      euroCountries.length !== euro.countries?.length ||
      euro.metadata?.major_market_revision !== MAJOR_MARKET_REVISION
    ) {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: euro.id },
          update: {
            name: "Europe",
            countries: euroCountries,
            metadata: {
              ...euro.metadata,
              major_market_revision: MAJOR_MARKET_REVISION,
            },
          },
        },
      })
    }
    for (const market of WORLD_MARKETS) {
      const existing = regions.find(
        (region) => region.currency_code === market.currency,
      )
      if (!existing) {
        await createRegionsWorkflow(container).run({
          input: {
            regions: [
              {
                name: market.name,
                currency_code: market.currency,
                countries: market.countries,
                payment_providers: ["pp_system_default"],
                metadata: { major_market_revision: MAJOR_MARKET_REVISION },
              },
            ],
          },
        })
      } else {
        const current = (existing.countries ?? [])
          .map((country) => country.iso_2!)
          .filter(Boolean)
        const countries = [...new Set([...current, ...market.countries])]
        if (countries.length !== current.length)
          await updateRegionsWorkflow(container).run({
            input: { selector: { id: existing.id }, update: { countries } },
          })
      }
    }
    logger.info(
      `Major markets configured: ${MAJOR_CURRENCIES.join(", ").toUpperCase()}; added prices to ${additions.length} variants.`,
    )
    return new StepResponse({
      currencies: MAJOR_CURRENCIES,
      pricedVariants: additions.length,
    })
  },
)

/** Consolidates European pricing and adds the main global currencies without repricing existing products or extending delivery zones. */
export const configureMajorMarketsWorkflow = createWorkflow(
  "configure-major-markets",
  (input: Record<string, never>) =>
    new WorkflowResponse(configureMajorMarketsStep(input)),
)
