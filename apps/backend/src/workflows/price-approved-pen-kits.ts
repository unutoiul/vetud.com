import type {
  CreatePricesDTO,
  UpdateProductVariantWorkflowInputDTO,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  APPROVED_PEN_PRICES,
  APPROVED_PEN_PRICE_REVISION,
} from "../seed/approved-pen-prices"

type PriceRow = {
  id: string
  currency_code: string
  amount: number
  price_list_id?: string | null
  min_quantity?: number | null
  max_quantity?: number | null
  rules_count?: number
  price_rules?: { attribute: string; value: string; operator?: string | null }[]
}
type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
  variants: { id: string; title: string; price_set?: { prices: PriceRow[] } }[]
}
const isBasePrice = (price: PriceRow) =>
  !price.price_list_id &&
  !price.rules_count &&
  !price.price_rules?.length &&
  price.min_quantity == null &&
  price.max_quantity == null

const prepareApprovedPenPricesStep = createStep(
  "prepare-approved-pen-prices",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["currency_code"],
    })
    const currencies = [
      ...new Set(regions.map((region) => region.currency_code)),
    ].sort()
    if (!currencies.includes("usd"))
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A USD region is required.",
      )
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.price_set.prices.*",
        "variants.price_set.prices.price_rules.*",
      ],
      filters: { handle: APPROVED_PEN_PRICES.map((product) => product.handle) },
    })
    const products: { id: string; metadata: Record<string, unknown> }[] = []
    const variants: UpdateProductVariantWorkflowInputDTO[] = []
    const summary: {
      handle: string
      size: string
      previousUsd: number
      usd: number
      prices: Record<string, number>
    }[] = []
    for (const target of APPROVED_PEN_PRICES) {
      const product = (data as unknown as ProductRow[]).find(
        (item) => item.handle === target.handle,
      )
      if (!product)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Missing pen kit: ${target.handle}`,
        )
      if (
        product.metadata?.pen_tier_pricing_revision ===
        APPROVED_PEN_PRICE_REVISION
      )
        continue
      if (product.variants.length !== 3)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${target.handle} must have exactly three amount variants.`,
        )
      const seen = new Set<number>()
      const previousUsd: Record<string, number> = {}
      for (const variant of product.variants) {
        const match = variant.title.trim().match(/^(10|20|40)\s*mg$/i)
        if (!match)
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Unexpected amount: ${target.handle} ${variant.title}`,
          )
        const amount = Number(match[1]) as 10 | 20 | 40
        if (seen.has(amount))
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Duplicate amount: ${target.handle} ${amount} mg`,
          )
        seen.add(amount)
        const oldPrices = variant.price_set?.prices ?? []
        const base = oldPrices.filter(isBasePrice)
        for (const currency of currencies) {
          const rows = base.filter((price) => price.currency_code === currency)
          if (
            rows.length !== 1 ||
            !Number.isFinite(Number(rows[0].amount)) ||
            !(Number(rows[0].amount) > 0)
          )
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `${target.handle} ${variant.title} needs exactly one positive base ${currency.toUpperCase()} price.`,
            )
        }
        const originalUsd = Number(
          base.find((price) => price.currency_code === "usd")!.amount,
        )
        const usd = target.prices[amount]
        const ratio = usd / originalUsd
        previousUsd[amount] = originalUsd
        const amounts: Record<string, number> = {}
        const prices: CreatePricesDTO[] = oldPrices
          .filter((price) => !price.price_list_id)
          .map((price) => {
            const rules: NonNullable<CreatePricesDTO["rules"]> = {}
            for (const rule of price.price_rules ?? []) {
              if (
                rule.attribute in rules ||
                (rule.operator && rule.operator !== "eq")
              )
                throw new MedusaError(
                  MedusaError.Types.INVALID_DATA,
                  `Review custom pricing rules for ${target.handle} ${variant.title} before changing retail prices.`,
                )
              rules[rule.attribute] = rule.value
            }
            let next = Number(price.amount)
            if (isBasePrice(price)) {
              const precision = ["huf", "isk"].includes(price.currency_code)
                ? 1
                : 100
              next =
                price.currency_code === "usd"
                  ? usd
                  : Math.round(next * ratio * precision) / precision
              amounts[price.currency_code] = next
            }
            return {
              id: price.id,
              currency_code: price.currency_code,
              amount: next,
              min_quantity: price.min_quantity,
              max_quantity: price.max_quantity,
              ...(Object.keys(rules).length ? { rules } : {}),
            }
          })
        variants.push({ id: variant.id, prices })
        summary.push({
          handle: target.handle,
          size: variant.title,
          previousUsd: originalUsd,
          usd,
          prices: amounts,
        })
      }
      products.push({
        id: product.id,
        metadata: {
          ...product.metadata,
          pen_tier_pricing_revision: APPROVED_PEN_PRICE_REVISION,
          pen_tier_pricing_usd: target.prices,
          pen_tier_pricing_previous_usd: previousUsd,
          retail_pricing_note:
            "User-approved USD tiers; other currencies increased proportionally using each variant's existing USD price. HUF and ISK rounded to whole units; other currencies to two decimal places.",
          us_pricing_provisional: false,
          us_pricing_note:
            "USD retail tiers explicitly approved by the user on 2026-10-13.",
        },
      })
    }
    return new StepResponse({ products, variants, summary })
  },
)

/** Applies approved USD tiers once and scales existing regional retail prices without changing stock or sprays. */
export const priceApprovedPenKitsWorkflow = createWorkflow(
  "price-approved-pen-kits",
  (input: Record<string, never>) => {
    const prepared = prepareApprovedPenPricesStep(input)
    when(
      "has-approved-pen-price-updates",
      prepared,
      (data) => data.variants.length > 0,
    ).then(() => {
      const updated = updateProductVariantsWorkflow.runAsStep({
        input: transform(prepared, (data) => ({
          product_variants: data.variants,
        })),
      })
      updateProductsWorkflow.runAsStep({
        input: transform({ prepared, updated }, ({ prepared: data }) => ({
          products: data.products,
        })),
      })
    })
    return new WorkflowResponse(
      transform(prepared, (data) => ({ updated: data.summary })),
    )
  },
)
