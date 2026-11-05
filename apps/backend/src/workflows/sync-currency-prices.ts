import type { CreatePricesDTO, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { BASE_CURRENCY, getExchangeRates, roundMoney } from "../lib/currencies"

type PriceRow = {
  id: string
  price_set_id?: string
  currency_code?: string
  amount?: unknown
  price_list_id?: string | null
  rules_count?: number | null
  min_quantity?: unknown
  max_quantity?: unknown
  updated_at?: Date | string
}

// Medusa generates `updatePrices` for the Price model, but the typed interface leaves it out.
// Unlike `updatePriceSets`, it changes only the rows it's given.
type PriceRowUpdater = { updatePrices(data: { id: string; amount: number }[]): Promise<unknown> }

export type SyncCurrencyPricesResult = { currencies: number; created: number; updated: number; removed: number; shippingUsd: number; withoutUsd: number }

/** A price that applies to everyone: not from a price list (sales), no rules, no quantity limits. */
const isRegular = (price: PriceRow) =>
  !price.price_list_id && !price.rules_count && price.min_quantity == null && price.max_quantity == null

const time = (value: PriceRow["updated_at"]) => (value ? new Date(value).getTime() : 0)

/**
 * The one place prices are converted.
 *  1. Shipping costs the same everywhere: every shipping option of a type (Standard, Express)
 *     gets the USD price most recently set on one of them in Admin.
 *  2. Every USD price is converted at today's rate and rounded to the currency's smallest unit:
 *     product variants and shipping options into every store currency (prices in other
 *     currencies are removed from shipping options). Since 2026-11-05 shoppers choose their
 *     currency whatever the country, so a delivery zone needs a price in each of them.
 * Only regular prices change. Sale price lists follow on their own (jobs/sync-storewide-sales.ts).
 */
const syncCurrencyPricesStep = createStep("sync-currency-prices", async (_input: Record<string, never>, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)

  const { data: stores } = await query.graph({ entity: "store", fields: ["supported_currencies.currency_code"] })
  const currencies = [...new Set((stores[0]?.supported_currencies ?? []).flatMap((currency) => (currency?.currency_code ? [currency.currency_code.toLowerCase()] : [])))]
    .filter((code) => code !== BASE_CURRENCY)
  const rates = await getExchangeRates()
  const missing = currencies.filter((code) => !rates[code])
  if (missing.length) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `No exchange rate for ${missing.join(", ").toUpperCase()}`)

  const [{ data: variantLinks }, { data: shippingLinks }, { data: shippingOptions }] = await Promise.all([
    query.graph({ entity: "product_variant_price_set", fields: ["price_set_id"] }),
    query.graph({ entity: "shipping_option_price_set", fields: ["shipping_option_id", "price_set_id"] }),
    query.graph({ entity: "shipping_option", fields: ["id", "type.code"] }),
  ])
  const optionById = new Map(shippingOptions.map((option) => [option.id, option]))
  const shipping = (shippingLinks as { shipping_option_id: string; price_set_id: string }[]).flatMap((link) => {
    const option = optionById.get(link.shipping_option_id)
    if (!option?.type?.code) return []
    return [{ priceSetId: link.price_set_id, type: option.type.code, currencies }]
  })
  const shippingSets = new Map(shipping.map((option) => [option.priceSetId, option]))
  const priceSetIds = [...new Set([...variantLinks.map((link) => link.price_set_id as string), ...shipping.map((option) => option.priceSetId)])]
  if (!priceSetIds.length) return new StepResponse<SyncCurrencyPricesResult>({ currencies: currencies.length, created: 0, updated: 0, removed: 0, shippingUsd: 0, withoutUsd: 0 })

  const prices = (await pricing.listPrices({ price_set_id: priceSetIds }, { take: null })) as PriceRow[]
  const regular = new Map<string, Map<string, PriceRow>>()
  for (const price of prices.filter(isRegular)) {
    const set = regular.get(price.price_set_id!) ?? new Map<string, PriceRow>()
    if (!set.has(price.currency_code!)) set.set(price.currency_code!, price)
    regular.set(price.price_set_id!, set)
  }
  const usdOf = new Map([...regular].flatMap(([setId, byCurrency]) => (byCurrency.has(BASE_CURRENCY) ? [[setId, Number(byCurrency.get(BASE_CURRENCY)!.amount)] as const] : [])))

  const create = new Map<string, CreatePricesDTO[]>()
  const update: { id: string; amount: number }[] = []
  const setAmount = (priceSetId: string, currency: string, amount: number) => {
    const existing = regular.get(priceSetId)?.get(currency)
    if (!existing) create.set(priceSetId, [...(create.get(priceSetId) ?? []), { currency_code: currency, amount }])
    else if (Math.abs(Number(existing.amount) - amount) > 1e-9) update.push({ id: existing.id, amount })
  }

  // 1. One USD price per shipping type: the one changed last.
  let shippingUsd = 0
  for (const type of new Set(shipping.map((option) => option.type))) {
    const sets = shipping.filter((option) => option.type === type).map((option) => option.priceSetId)
    const latest = sets.map((id) => regular.get(id)?.get(BASE_CURRENCY)).filter((price): price is PriceRow => !!price).sort((a, b) => time(b.updated_at) - time(a.updated_at))[0]
    if (!latest) continue
    const amount = Number(latest.amount)
    for (const id of sets) {
      if (usdOf.get(id) === amount) continue
      setAmount(id, BASE_CURRENCY, amount)
      usdOf.set(id, amount)
      shippingUsd++
    }
  }

  // 2. Every other currency from USD.
  const remove: string[] = []
  for (const setId of priceSetIds) {
    const usd = usdOf.get(setId)
    if (usd === undefined) continue
    const targets = shippingSets.get(setId)?.currencies ?? currencies
    for (const currency of targets) setAmount(setId, currency, roundMoney(usd * rates[currency], currency))
    if (shippingSets.has(setId)) {
      for (const [currency, price] of regular.get(setId) ?? []) if (currency !== BASE_CURRENCY && !targets.includes(currency)) remove.push(price.id)
    }
  }

  if (create.size) await pricing.addPrices([...create].map(([priceSetId, prices]) => ({ priceSetId, prices })))
  if (update.length) await (pricing as unknown as PriceRowUpdater).updatePrices(update)
  if (remove.length) await pricing.removePrices(remove)
  return new StepResponse<SyncCurrencyPricesResult>({
    currencies: currencies.length,
    created: [...create.values()].reduce((total, prices) => total + prices.length, 0),
    updated: update.length,
    removed: remove.length,
    shippingUsd,
    withoutUsd: priceSetIds.length - usdOf.size,
  })
})

export const syncCurrencyPricesWorkflow = createWorkflow("sync-currency-prices", (input: Record<string, never>) =>
  new WorkflowResponse(syncCurrencyPricesStep(input))
)

/** Runs the sync and logs what changed; used by the hourly job and the deploy migration. */
export async function syncCurrencyPrices(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await syncCurrencyPricesWorkflow(container).run({ input: {} })
  if (result.created || result.updated || result.removed) {
    logger.info(`Currency prices: ${result.updated} updated, ${result.created} added and ${result.removed} removed in ${result.currencies} currencies from USD${result.shippingUsd ? ` (${result.shippingUsd} shipping options aligned to one USD rate)` : ""}.`)
  }
  if (result.withoutUsd) logger.warn(`Currency prices: ${result.withoutUsd} price sets have no USD price, so they weren't converted.`)
  return result
}
