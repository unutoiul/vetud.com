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
import { BASE_CURRENCY } from "../lib/currencies"
import {
  PREMIUM_PRICE_HANDLES,
  PREMIUM_PRICE_MULTIPLIER,
  PREMIUM_PRICE_REVISION,
} from "../seed/premium-product-prices"

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

const preparePremiumPricesStep = createStep(
  "prepare-premium-prices",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
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
      filters: { handle: PREMIUM_PRICE_HANDLES },
    })
    const products: { id: string; metadata: Record<string, unknown> }[] = []
    const variants: UpdateProductVariantWorkflowInputDTO[] = []
    const summary: {
      handle: string
      title: string
      usd: number
    }[] = []
    for (const handle of PREMIUM_PRICE_HANDLES) {
      const product = (data as unknown as ProductRow[]).find(
        (item) => item.handle === handle,
      )
      if (!product)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Missing product: ${handle}`,
        )
      if (product.metadata?.retail_pricing_revision === PREMIUM_PRICE_REVISION)
        continue
      if (!product.variants.length)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${handle} has no variants.`,
        )
      for (const variant of product.variants) {
        const oldPrices = variant.price_set?.prices ?? []
        const basePrices = oldPrices.filter(isBasePrice)
        const usd = basePrices.filter((price) => price.currency_code === BASE_CURRENCY)
        if (usd.length !== 1 || !(Number(usd[0].amount) > 0))
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `${handle} ${variant.title} needs one positive base USD price.`,
          )
        // Only the USD price doubles; the other currencies are converted from it.
        const doubled = Math.round(Number(usd[0].amount) * PREMIUM_PRICE_MULTIPLIER * 100) / 100

        const prices: CreatePricesDTO[] = oldPrices
          .filter((price) => !price.price_list_id)
          .map((price) => {
            // Keep non-retail pricing conditions. Their IDs, quantities and rules stay in the update.
            const rules: NonNullable<CreatePricesDTO["rules"]> = {}
            for (const rule of price.price_rules ?? []) {
              if (rule.attribute in rules)
                throw new MedusaError(
                  MedusaError.Types.INVALID_DATA,
                  `Multiple pricing rules for ${handle} ${variant.title}: ${rule.attribute}`,
                )
              if (rule.operator && rule.operator !== "eq")
                throw new MedusaError(
                  MedusaError.Types.INVALID_DATA,
                  `Review custom pricing rules for ${handle} ${variant.title} before changing retail prices.`,
                )
              rules[rule.attribute] = rule.value
            }
            return {
              id: price.id,
              currency_code: price.currency_code,
              amount:
                price.id === usd[0].id ? doubled : price.amount,
              min_quantity: price.min_quantity,
              max_quantity: price.max_quantity,
              ...(Object.keys(rules).length ? { rules } : {}),
            }
          })
        variants.push({ id: variant.id, prices })
        summary.push({ handle, title: variant.title, usd: doubled })
      }
      products.push({
        id: product.id,
        metadata: {
          ...product.metadata,
          retail_pricing_revision: PREMIUM_PRICE_REVISION,
          retail_pricing_multiplier: PREMIUM_PRICE_MULTIPLIER,
          retail_pricing_note: "User-requested 100% increase of the USD retail price.",
        },
      })
    }
    return new StepResponse({ products, variants, summary })
  },
)

/** Doubles the USD retail prices once, without altering stock. */
export const pricePremiumProductsWorkflow = createWorkflow(
  "price-premium-products",
  (input: Record<string, never>) => {
    const prepared = preparePremiumPricesStep(input)
    when(
      "has-premium-price-updates",
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
      transform(prepared, (data) => ({
        updated: data.summary,
      })),
    )
  },
)
