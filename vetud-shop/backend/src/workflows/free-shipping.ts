import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { MedusaContainer, PricingTypes } from "@medusajs/framework/types"
import { BASE_CURRENCY, getExchangeRates } from "../lib/currencies"
import { FREE_SHIPPING_OPTION_TYPE, freeShippingThresholds } from "../lib/free-shipping"

export type SetFreeShippingInput = {
  /** Free Standard shipping from this cart total in US dollars, or null to turn free shipping off. */
  amount_usd: number | null
}

type RulePrice = { price_set_id: string; currency_code: string; value: number }
type Snapshot = { prices: RulePrice[]; thresholds: { region_id: string; value: unknown }[] }

type PriceWithRules = {
  id: string
  currency_code: string
  price_rules?: { attribute: string; value: string | number }[] | null
}

/** The Standard shipping options' price sets, with their prices and price rules. */
async function standardPriceSets(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: options }, { data: links }] = await Promise.all([
    query.graph({ entity: "shipping_option", fields: ["id", "type.code"] }),
    query.graph({ entity: "shipping_option_price_set", fields: ["shipping_option_id", "price_set_id"] }),
  ])
  const standard = new Set(
    options.filter((option) => option.type?.code === FREE_SHIPPING_OPTION_TYPE).map((option) => option.id),
  )
  const ids = (links as { shipping_option_id: string; price_set_id: string }[])
    .filter((link) => standard.has(link.shipping_option_id))
    .map((link) => link.price_set_id)
  if (!ids.length) return []
  return await container
    .resolve(Modules.PRICING)
    .listPriceSets({ id: ids }, { relations: ["prices", "prices.price_rules"] })
}

const isFreeOverPrice = (price: PriceWithRules) =>
  (price.price_rules ?? []).some((rule) => rule.attribute === "item_total")

/** Replaces every "free over X" Standard price with the given thresholds (per currency). */
async function applyFreeOverPrices(container: MedusaContainer, thresholds: Record<string, number>) {
  const pricing = container.resolve(Modules.PRICING)
  const sets = await standardPriceSets(container)
  const old = sets.flatMap((set) =>
    ((set.prices ?? []) as PriceWithRules[]).filter(isFreeOverPrice).map((price) => price.id),
  )
  const add: PricingTypes.AddPricesDTO[] = sets.flatMap((set) => {
    // A Standard option is free only in the currencies it already charges in.
    const charged = new Set(
      ((set.prices ?? []) as PriceWithRules[])
        .filter((price) => !(price.price_rules ?? []).length)
        .map((price) => price.currency_code.toLowerCase()),
    )
    const prices = Object.entries(thresholds)
      .filter(([currency]) => charged.has(currency))
      .map(([currency_code, value]) => ({
        currency_code,
        amount: 0,
        rules: { item_total: [{ operator: "gte" as const, value }] },
      }))
    return prices.length ? [{ priceSetId: set.id, prices }] : []
  })
  if (old.length) await pricing.removePrices(old)
  if (add.length) await pricing.addPrices(add)
  return {
    removed: old.length,
    added: add.reduce((total, entry) => total + entry.prices.length, 0),
    options: sets.length,
  }
}

/**
 * Sets free Standard shipping from one dollar amount, in every region and currency at once: the
 * storefront's threshold (region metadata) and the 0-priced shipping price that makes it free.
 * Undone as a whole if anything fails.
 */
export const setFreeShippingStep = createStep(
  "set-free-shipping",
  async (input: SetFreeShippingInput, { container }) => {
    const regionModule = container.resolve(Modules.REGION)
    const regions = await regionModule.listRegions({}, { select: ["id", "name", "currency_code", "metadata"] })
    const sets = await standardPriceSets(container)
    if (input.amount_usd !== null && !sets.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "There's no Standard shipping option to make free.")
    }

    const snapshot: Snapshot = {
      prices: sets.flatMap((set) =>
        ((set.prices ?? []) as PriceWithRules[]).filter(isFreeOverPrice).map((price) => ({
          price_set_id: set.id,
          currency_code: price.currency_code,
          value: Number(price.price_rules!.find((rule) => rule.attribute === "item_total")!.value),
        })),
      ),
      thresholds: regions.map((region) => ({ region_id: region.id, value: region.metadata?.free_shipping_threshold })),
    }

    // Only currencies Standard shipping is sold in: elsewhere the site would promise a free shipping
    // that checkout can't apply.
    const charged = new Set(
      sets.flatMap((set) =>
        ((set.prices ?? []) as PriceWithRules[])
          .filter((price) => !(price.price_rules ?? []).length)
          .map((price) => price.currency_code.toLowerCase()),
      ),
    )
    const currencies = regions.map((region) => region.currency_code.toLowerCase()).filter((code) => charged.has(code))
    const needsRates = input.amount_usd !== null && currencies.some((code) => code !== BASE_CURRENCY)
    const thresholds =
      input.amount_usd === null
        ? {}
        : freeShippingThresholds(input.amount_usd, currencies, needsRates ? await getExchangeRates() : {})

    const prices = await applyFreeOverPrices(container, thresholds)
    const updated: { region: string; currency_code: string; threshold: number | null }[] = []
    for (const region of regions) {
      const value = thresholds[region.currency_code.toLowerCase()]
      // An empty string deletes the metadata key: no threshold, no progress bar.
      await regionModule.updateRegions(region.id, { metadata: { free_shipping_threshold: value ?? "" } })
      updated.push({ region: region.name, currency_code: region.currency_code, threshold: value ?? null })
    }
    return new StepResponse({ amount_usd: input.amount_usd, regions: updated, ...prices }, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const pricing = container.resolve(Modules.PRICING)
    const sets = await standardPriceSets(container)
    const current = sets.flatMap((set) =>
      ((set.prices ?? []) as PriceWithRules[]).filter(isFreeOverPrice).map((price) => price.id),
    )
    if (current.length) await pricing.removePrices(current)
    const bySet = new Map<string, RulePrice[]>()
    for (const price of snapshot.prices)
      bySet.set(price.price_set_id, [...(bySet.get(price.price_set_id) ?? []), price])
    if (bySet.size) {
      await pricing.addPrices(
        [...bySet].map(([priceSetId, prices]) => ({
          priceSetId,
          prices: prices.map((price) => ({
            currency_code: price.currency_code,
            amount: 0,
            rules: { item_total: [{ operator: "gte" as const, value: price.value }] },
          })),
        })),
      )
    }
    const regionModule = container.resolve(Modules.REGION)
    for (const { region_id, value } of snapshot.thresholds) {
      await regionModule.updateRegions(region_id, {
        metadata: { free_shipping_threshold: typeof value === "number" ? value : "" },
      })
    }
  },
)

export const setFreeShippingWorkflow = createWorkflow("set-free-shipping", function (input: SetFreeShippingInput) {
  return new WorkflowResponse(setFreeShippingStep(input))
})

/** What Admin shows: each region's threshold and whether its currency really ships free from it. */
export async function readFreeShipping(container: MedusaContainer) {
  const regions = await container
    .resolve(Modules.REGION)
    .listRegions({}, { select: ["id", "name", "currency_code", "metadata"] })
  const sets = await standardPriceSets(container)
  const freeOver = new Map<string, Set<number>>()
  for (const set of sets) {
    for (const price of (set.prices ?? []) as PriceWithRules[]) {
      const rule = (price.price_rules ?? []).find((candidate) => candidate.attribute === "item_total")
      if (!rule) continue
      const currency = price.currency_code.toLowerCase()
      freeOver.set(currency, new Set([...(freeOver.get(currency) ?? []), Number(rule.value)]))
    }
  }
  const usd = regions.find((region) => region.currency_code.toLowerCase() === BASE_CURRENCY)?.metadata
    ?.free_shipping_threshold
  return {
    amount_usd: typeof usd === "number" ? usd : null,
    standard_options: sets.length,
    regions: regions.map((region) => {
      const threshold =
        typeof region.metadata?.free_shipping_threshold === "number" ? region.metadata.free_shipping_threshold : null
      const rules = [...(freeOver.get(region.currency_code.toLowerCase()) ?? [])]
      return {
        name: region.name,
        currency_code: region.currency_code,
        threshold,
        // Shown on the site and applied at checkout must agree; anything else is flagged in Admin.
        in_sync: threshold === null ? rules.length === 0 : rules.length === 1 && rules[0] === threshold,
      }
    }),
  }
}
