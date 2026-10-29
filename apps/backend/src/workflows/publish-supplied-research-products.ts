import type { CreatePricesDTO, MedusaContainer, UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createInventoryLevelsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUPPLIED_PUBLICATIONS, WHOLE_UNIT_CURRENCIES } from "../seed/supplied-research-publication"

type ExchangeService = { getExchangeRates: (base: string) => Promise<Record<string, number>> }

type PriceRow = {
  id: string
  currency_code: string
  amount: number
  price_list_id?: string | null
  rules_count?: number | null
  min_quantity?: number | null
  max_quantity?: number | null
}

type ProductRow = {
  id: string
  handle: string
  status: string
  metadata?: Record<string, unknown> | null
  sales_channels?: { id: string }[]
  variants: {
    id: string
    title: string
    price_set?: { id: string; prices: PriceRow[] }
    inventory_items?: { inventory_item_id: string; inventory?: { location_levels?: { location_id: string }[] } }[]
  }[]
}

export type PriceAddition = { priceSetId: string; existingPriceIds: string[]; prices: CreatePricesDTO[] }
export type LevelInput = { inventory_item_id: string; location_id: string; stocked_quantity: number }

function convert(eur: number, rate: number, currency: string) {
  const amount = eur * rate
  return WHOLE_UNIT_CURRENCIES.has(currency) ? Math.round(amount) : Math.round(amount * 100) / 100
}

/**
 * Works out every change before anything is written: missing regional prices (converted from the
 * EUR price with the store's exchange-rate feed), zero-stock levels so Admin can set stock, and
 * the published copy. Throws if the catalog is not in the expected state.
 */
export async function planSuppliedPublication(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = SUPPLIED_PUBLICATIONS.map((publication) => publication.handle)
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id", "handle", "status", "metadata", "sales_channels.id",
      "variants.id", "variants.title", "variants.price_set.id", "variants.price_set.prices.*",
      "variants.inventory_items.inventory_item_id", "variants.inventory_items.inventory.location_levels.location_id",
    ],
    filters: { handle: handles },
  })
  const products = data as unknown as ProductRow[]
  const { data: regions } = await query.graph({ entity: "region", fields: ["currency_code"] })
  const currencies = [...new Set(regions.map((region) => region.currency_code))].sort()

  const priceAdditions: PriceAddition[] = []
  const levels: LevelInput[] = []
  const updates: UpsertProductDTO[] = []
  const summary: { handle: string; addedPrices: Record<string, number>; zeroStockLocations: number }[] = []
  let rates: Record<string, number> | undefined

  for (const publication of SUPPLIED_PUBLICATIONS) {
    const product = products.find((row) => row.handle === publication.handle)
    if (!product) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing product: ${publication.handle}`)
    if (product.variants.length !== 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${publication.handle} should have one variant.`)
    const variant = product.variants[0]
    const prices = variant.price_set?.prices ?? []
    const base = prices.filter((price) => price.currency_code === "eur" && !price.price_list_id && !price.rules_count && price.min_quantity == null && price.max_quantity == null)
    if (!variant.price_set || base.length !== 1 || !(Number(base[0].amount) > 0)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `${publication.handle} needs one positive base EUR price.`)
    }

    const missing = currencies.filter((currency) => !prices.some((price) => price.currency_code === currency))
    let added: { currency_code: string; amount: number }[] = []
    if (missing.length) {
      rates ??= await container.resolve<ExchangeService>("currencyExchangeService").getExchangeRates("eur")
      added = missing.map((currency) => {
        const rate = rates?.[currency]
        if (!rate || !Number.isFinite(rate) || rate <= 0) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Missing exchange rate for ${currency.toUpperCase()}.`)
        return { currency_code: currency, amount: convert(Number(base[0].amount), rate, currency) }
      })
      priceAdditions.push({ priceSetId: variant.price_set.id, existingPriceIds: prices.map((price) => price.id), prices: added })
    }

    // Give each kit a zero stock level wherever its sales channel ships from, so stock can be typed in Admin.
    const channelIds = (product.sales_channels ?? []).map((channel) => channel.id)
    const { data: channels } = channelIds.length
      ? await query.graph({ entity: "sales_channel", fields: ["id", "stock_locations.id"], filters: { id: channelIds } })
      : { data: [] }
    const locationIds = [...new Set(channels.flatMap((channel) => (channel.stock_locations ?? []).flatMap((location) => (location ? [location.id] : []))))]
    if (!locationIds.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${publication.handle} has no stock location through its sales channel.`)
    const items = variant.inventory_items ?? []
    if (items.length !== 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${publication.handle} should have one inventory item.`)
    const stocked = new Set((items[0].inventory?.location_levels ?? []).map((level) => level.location_id))
    const newLevels = locationIds.filter((id) => !stocked.has(id)).map((location_id) => ({ inventory_item_id: items[0].inventory_item_id, location_id, stocked_quantity: 0 }))
    levels.push(...newLevels)

    updates.push({
      id: product.id,
      status: ProductStatus.PUBLISHED,
      subtitle: publication.subtitle,
      description: publication.description,
      metadata: { ...(product.metadata ?? {}), ...publication.metadata },
    })
    summary.push({
      handle: publication.handle,
      addedPrices: Object.fromEntries(added.map((price) => [price.currency_code, price.amount])),
      zeroStockLocations: newLevels.length,
    })
  }

  return { priceAdditions, levels, updates, summary, currencies }
}

const planSuppliedPublicationStep = createStep(
  "plan-supplied-publication",
  async (_input: Record<string, never>, { container }) => new StepResponse(await planSuppliedPublication(container))
)

const addSuppliedPricesStep = createStep(
  "add-supplied-prices",
  async (additions: PriceAddition[], { container }) => {
    const pricing = container.resolve(Modules.PRICING)
    const created: string[] = []
    for (const addition of additions) {
      await pricing.addPrices({ priceSetId: addition.priceSetId, prices: addition.prices })
      const prices = await pricing.listPrices({ price_set_id: [addition.priceSetId] })
      created.push(...prices.filter((price) => !addition.existingPriceIds.includes(price.id)).map((price) => price.id))
    }
    return new StepResponse(created, created)
  },
  async (created, { container }) => {
    if (created?.length) await container.resolve(Modules.PRICING).removePrices(created)
  }
)

/** Prices and stock levels first, publication last, so a failure never leaves a half-ready product visible. */
export const publishSuppliedResearchProductsWorkflow = createWorkflow(
  "publish-supplied-research-products",
  (input: Record<string, never>) => {
    const plan = planSuppliedPublicationStep(input)
    addSuppliedPricesStep(transform(plan, (data) => data.priceAdditions))
    when("has-zero-stock-levels", plan, (data) => data.levels.length > 0).then(() =>
      createInventoryLevelsWorkflow.runAsStep({ input: transform(plan, (data) => ({ inventory_levels: data.levels })) })
    )
    updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.updates })) })
    return new WorkflowResponse(transform(plan, (data) => data.summary))
  }
)
