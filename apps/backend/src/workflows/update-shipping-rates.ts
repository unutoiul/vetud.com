import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

export type UpdateShippingRatesInput = {
  /** The currency whose flat rates change, e.g. "usd". Other currencies are left alone. */
  currency_code: string
  /** New flat price per shipping option type code, e.g. { standard: 24.95, express: 50 }. */
  rates: Record<string, number>
}

type PriceChange = { id: string; option: string; from: number; to: number }

// Medusa generates `updatePrices` for the Price model, but the typed interface leaves it out.
// Unlike `updatePriceSets`, it changes only the rows it's given.
type PriceRowUpdater = { updatePrices(data: { id: string; amount: number }[]): Promise<unknown> }

/**
 * Sets the flat price of each shipping option type in one currency. Only the plain price changes:
 * prices with rules (such as free shipping over a cart total) and other currencies stay as they are.
 */
const updateShippingRatesStep = createStep(
  "update-shipping-rates",
  async (input: UpdateShippingRatesInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const pricing = container.resolve(Modules.PRICING)
    const currency = input.currency_code.toLowerCase()

    const { data: options } = await query.graph({ entity: "shipping_option", fields: ["id", "name", "type.code"] })
    const { data: links } = await query.graph({ entity: "shipping_option_price_set", fields: ["shipping_option_id", "price_set_id"] })
    const priceSetOf = new Map((links as { shipping_option_id: string; price_set_id: string }[]).map((link) => [link.shipping_option_id, link.price_set_id]))
    const targets = options.filter((option) => option.type?.code && input.rates[option.type.code] !== undefined && priceSetOf.has(option.id))
    if (!targets.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, `No shipping options with the types ${Object.keys(input.rates).join(", ")}.`)

    const priceSets = await pricing.listPriceSets({ id: targets.map((option) => priceSetOf.get(option.id)!) }, { relations: ["prices", "prices.price_rules"] })
    const changes: PriceChange[] = []
    for (const option of targets) {
      const priceSet = priceSets.find((set) => set.id === priceSetOf.get(option.id))
      const flat = (priceSet?.prices ?? []).filter((price) => price.currency_code === currency && !(price as { price_rules?: unknown[] }).price_rules?.length)
      for (const price of flat) {
        const to = input.rates[option.type!.code]
        if (Number(price.amount) !== to) changes.push({ id: price.id, option: option.name, from: Number(price.amount), to })
      }
    }
    if (changes.length) await (pricing as unknown as PriceRowUpdater).updatePrices(changes.map(({ id, to }) => ({ id, amount: to })))
    return new StepResponse(changes, changes)
  },
  async (changes, { container }) => {
    if (!changes?.length) return
    const pricing = container.resolve(Modules.PRICING) as unknown as PriceRowUpdater
    await pricing.updatePrices(changes.map(({ id, from }) => ({ id, amount: from })))
  }
)

export const updateShippingRatesWorkflow = createWorkflow(
  "update-shipping-rates",
  function (input: UpdateShippingRatesInput) {
    return new WorkflowResponse(updateShippingRatesStep(input))
  }
)
