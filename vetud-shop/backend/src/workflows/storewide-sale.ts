import type { PriceListStatus } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, type WorkflowData, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { batchPriceListPricesWorkflow, createPriceListsWorkflow, deletePriceListsWorkflow, updatePriceListsWorkflow } from "@medusajs/medusa/core-flows"
import { isSaleExcluded, MAX_PERCENT_OFF, MIN_PERCENT_OFF, planSalePrices, readSaleSettings, SALE_METADATA_KEY, saleDescription, type PriceRow, type SalePricePlan, type VariantPrices } from "../lib/storewide-sale"

type SaleFields = {
  title: string
  percent_off: number
  starts_at: string | null
  ends_at: string | null
  status: PriceListStatus
}

export type CreateStorewideSaleInput = SaleFields
export type UpdateStorewideSaleInput = { id: string } & Partial<SaleFields>

type StoredSale = SaleFields & { id: string; metadata: Record<string, unknown> | null }

function validateSale(sale: SaleFields) {
  if (!sale.title.trim()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Give the sale a name.")
  if (!Number.isInteger(sale.percent_off) || sale.percent_off < MIN_PERCENT_OFF || sale.percent_off > MAX_PERCENT_OFF) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `The discount must be a whole number from ${MIN_PERCENT_OFF} to ${MAX_PERCENT_OFF}%.`)
  }
  if (sale.starts_at && sale.ends_at && new Date(sale.ends_at) <= new Date(sale.starts_at)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sale must end after it starts.")
  }
}

const toIso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null)

const PRICE_FIELDS = ["id", "amount", "currency_code", "price_list_id", "min_quantity", "max_quantity", "rules_count"]
const PAGE = 2000

/** Loads a price list that Admin > Sales manages; any other price list is refused. */
const getStorewideSaleStep = createStep(
  "get-storewide-sale",
  async (input: { id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "price_list",
      fields: ["id", "title", "status", "starts_at", "ends_at", "metadata"],
      filters: { id: input.id },
    })
    const list = data[0]
    const settings = list ? readSaleSettings(list.metadata) : null
    if (!list || !settings) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Sale ${input.id} was not found.`)
    const sale: StoredSale = {
      id: list.id,
      title: list.title,
      percent_off: settings.percent_off,
      starts_at: toIso(list.starts_at),
      ends_at: toIso(list.ends_at),
      status: list.status as PriceListStatus,
      metadata: (list.metadata ?? null) as Record<string, unknown> | null,
    }
    return new StepResponse(sale)
  }
)

/** Checks the new values (merged with the stored ones when editing) before anything is written. */
const validateStorewideSaleStep = createStep(
  "validate-storewide-sale",
  async (input: SaleFields) => {
    validateSale(input)
    return new StepResponse(input)
  }
)

/** Works out the sale price of every variant in every currency, and what to change in the price list. */
const planStorewideSalePricesStep = createStep(
  "plan-storewide-sale-prices",
  async (input: { price_list_id: string | null; percent_off: number }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    // A price set's `prices` holds only its regular prices, so the sale's own prices are read separately.
    const { data } = await query.graph({
      entity: "product_variant",
      fields: ["id", "price_set.id", "product.metadata", ...PRICE_FIELDS.map((field) => `price_set.prices.${field}`)],
    })
    const listed = new Map<string, PriceRow[]>()
    if (input.price_list_id) {
      for (let skip = 0; ; skip += PAGE) {
        const { data: page } = await query.graph({
          entity: "price",
          fields: ["price_set_id", ...PRICE_FIELDS],
          filters: { price_list_id: input.price_list_id },
          pagination: { skip, take: PAGE, order: { id: "ASC" } },
        })
        for (const price of page as unknown as (PriceRow & { price_set_id: string })[]) {
          listed.set(price.price_set_id, [...(listed.get(price.price_set_id) ?? []), price])
        }
        if (page.length < PAGE) break
      }
    }
    const variants: VariantPrices[] = (data as unknown as (VariantPrices & { price_set?: { id?: string } | null; product?: { metadata?: Record<string, unknown> | null } | null })[]).map((variant) => ({
      id: variant.id,
      excluded: isSaleExcluded(variant.product?.metadata),
      price_set: { prices: [...(variant.price_set?.prices ?? []), ...(listed.get(variant.price_set?.id ?? "") ?? [])] },
    }))
    return new StepResponse(planSalePrices(variants, input.price_list_id, input.percent_off))
  }
)

/** Creates a sale: a "sale" price list with every variant's price less the percentage. */
export const createStorewideSaleWorkflow = createWorkflow(
  "create-storewide-sale",
  function (input: CreateStorewideSaleInput) {
    const sale = validateStorewideSaleStep(input)
    const plan = planStorewideSalePricesStep(transform({ sale }, ({ sale }) => ({ price_list_id: null, percent_off: sale.percent_off })))
    const created = createPriceListsWorkflow.runAsStep({
      input: transform({ sale, plan }, ({ sale, plan }) => ({
        price_lists_data: [{
          title: sale.title.trim(),
          description: saleDescription(sale.percent_off),
          starts_at: sale.starts_at,
          ends_at: sale.ends_at,
          status: sale.status,
          metadata: { [SALE_METADATA_KEY]: { percent_off: sale.percent_off } },
          prices: plan.create,
        }],
      })),
    })
    return new WorkflowResponse(transform({ created, plan }, ({ created, plan }) => ({ id: created[0].id, prices: plan.create.length })))
  }
)

/** Applies the price changes a plan lists; nothing runs when the prices are already right. */
function applyPlan(priceListId: WorkflowData<string>, plan: WorkflowData<SalePricePlan>) {
  return when("storewide-sale-prices-changed", { plan }, ({ plan }) => plan.create.length + plan.update.length + plan.delete.length > 0).then(() => {
    batchPriceListPricesWorkflow.runAsStep({
      input: transform({ priceListId, plan }, ({ priceListId, plan }) => ({
        data: { id: priceListId, create: plan.create, update: plan.update, delete: plan.delete },
      })),
    })
  })
}

/**
 * Edits a sale (name, percentage, dates, on/off) and recalculates its prices. Saving without
 * changes still recalculates, which picks up new products and changed regular prices.
 */
export const updateStorewideSaleWorkflow = createWorkflow(
  "update-storewide-sale",
  function (input: UpdateStorewideSaleInput) {
    const stored = getStorewideSaleStep(transform({ input }, ({ input }) => ({ id: input.id })))
    const merged = transform({ input, stored }, ({ input, stored }) => ({
      title: input.title ?? stored.title,
      percent_off: input.percent_off ?? stored.percent_off,
      starts_at: input.starts_at === undefined ? stored.starts_at : input.starts_at,
      ends_at: input.ends_at === undefined ? stored.ends_at : input.ends_at,
      status: input.status ?? stored.status,
    }))
    const sale = validateStorewideSaleStep(merged)
    updatePriceListsWorkflow.runAsStep({
      input: transform({ stored, sale }, ({ stored, sale }) => ({
        price_lists_data: [{
          id: stored.id,
          title: sale.title.trim(),
          description: saleDescription(sale.percent_off),
          starts_at: sale.starts_at,
          ends_at: sale.ends_at,
          status: sale.status,
          metadata: { ...(stored.metadata ?? {}), [SALE_METADATA_KEY]: { percent_off: sale.percent_off } },
        }],
      })),
    })
    const plan = planStorewideSalePricesStep(transform({ stored, sale }, ({ stored, sale }) => ({ price_list_id: stored.id, percent_off: sale.percent_off })))
    applyPlan(transform({ stored }, ({ stored }) => stored.id), plan)
    return new WorkflowResponse(transform({ stored, plan }, ({ stored, plan }) => ({ id: stored.id, created: plan.create.length, updated: plan.update.length, deleted: plan.delete.length })))
  }
)

/** Recalculates a sale's prices from the current regular prices (run on a schedule). */
export const syncStorewideSaleWorkflow = createWorkflow(
  "sync-storewide-sale",
  function (input: { id: string }) {
    const stored = getStorewideSaleStep(input)
    const plan = planStorewideSalePricesStep(transform({ stored }, ({ stored }) => ({ price_list_id: stored.id, percent_off: stored.percent_off })))
    applyPlan(transform({ stored }, ({ stored }) => stored.id), plan)
    return new WorkflowResponse(transform({ stored, plan }, ({ stored, plan }) => ({ id: stored.id, created: plan.create.length, updated: plan.update.length, deleted: plan.delete.length })))
  }
)

/**
 * Removes a sale's prices for good. Medusa's soft delete takes about 20 ms a price (a minute or
 * more for a whole sale), while a hard delete takes well under one, and nothing else refers to
 * these prices: orders keep their own copy. There's no undo; if a later step fails, the sale still
 * exists and the 15-minute job puts its prices back.
 */
const removeStorewideSalePricesStep = createStep(
  "remove-storewide-sale-prices",
  async (input: { id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const pricing = container.resolve(Modules.PRICING)
    let removed = 0
    for (;;) {
      const { data } = await query.graph({ entity: "price", fields: ["id"], filters: { price_list_id: input.id }, pagination: { skip: 0, take: PAGE } })
      if (!data.length) break
      await pricing.removePrices(data.map((price) => price.id))
      removed += data.length
    }
    return new StepResponse(removed)
  }
)

/** Deletes a sale and its prices; the regular prices apply again straight away. */
export const deleteStorewideSaleWorkflow = createWorkflow(
  "delete-storewide-sale",
  function (input: { id: string }) {
    const stored = getStorewideSaleStep(input)
    const removed = removeStorewideSalePricesStep(transform({ stored }, ({ stored }) => ({ id: stored.id })))
    deletePriceListsWorkflow.runAsStep({ input: transform({ stored }, ({ stored }) => ({ ids: [stored.id] })) })
    return new WorkflowResponse(transform({ stored, removed }, ({ stored, removed }) => ({ id: stored.id, prices: removed })))
  }
)
