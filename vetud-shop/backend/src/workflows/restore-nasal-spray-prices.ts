import type { UpdateProductVariantWorkflowInputDTO } from "@medusajs/framework/types"
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
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { PREMIUM_PRICE_REVISION } from "../seed/premium-product-prices"

const REVISION = "nasal-original-retail-2026-10-13-v1"
type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
  variants: {
    id: string
    price_set?: {
      prices: {
        id: string
        currency_code: string
        amount: number
        price_list_id?: string | null
        rules_count?: number
        price_rules?: unknown[]
        min_quantity?: number | null
        max_quantity?: number | null
      }[]
    }
  }[]
}
const prepareNasalPricesStep = createStep(
  "prepare-nasal-prices",
  async (_input: Record<string, never>, { container }) => {
    const handles = NASAL_SPRAYS.map((product) => product.handle)
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product",
        fields: [
          "id",
          "handle",
          "metadata",
          "variants.id",
          "variants.price_set.prices.*",
          "variants.price_set.prices.price_rules.*",
        ],
        filters: { handle: handles },
      })
    const products: { id: string; metadata: Record<string, unknown> }[] = []
    const variants: UpdateProductVariantWorkflowInputDTO[] = []
    for (const handle of handles) {
      const product = (data as unknown as ProductRow[]).find(
        (item) => item.handle === handle,
      )
      if (!product)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Missing nasal spray: ${handle}`,
        )
      if (product.metadata?.nasal_pricing_revision === REVISION) continue
      if (
        product.metadata?.retail_pricing_revision === PREMIUM_PRICE_REVISION &&
        product.metadata?.retail_pricing_multiplier === 2
      ) {
        for (const variant of product.variants ?? []) {
          const retail = (variant.price_set?.prices ?? []).filter(
            (price) => !price.price_list_id,
          )
          if (
            !retail.length ||
            retail.some(
              (price) =>
                price.rules_count ||
                price.price_rules?.length ||
                price.min_quantity != null ||
                price.max_quantity != null ||
                !(Number(price.amount) > 0),
            )
          )
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Review custom or invalid pricing for ${handle} before restoring.`,
            )
          variants.push({
            id: variant.id,
            prices: retail.map((price) => ({
              id: price.id,
              currency_code: price.currency_code,
              amount: Math.round(Number(price.amount) * 50) / 100,
            })),
          })
        }
      }
      products.push({
        id: product.id,
        metadata: {
          ...product.metadata,
          nasal_pricing_revision: REVISION,
          retail_pricing_multiplier: 1,
          retail_pricing_note:
            "Nasal sprays excluded from the user-requested pen kit price increase; original retail prices restored.",
        },
      })
    }
    return new StepResponse({ products, variants })
  },
)

/** Reverses only the recorded nasal spray increase, once, preserving all pen kit prices. */
export const restoreNasalSprayPricesWorkflow = createWorkflow(
  "restore-nasal-spray-prices",
  (input: Record<string, never>) => {
    const prepared = prepareNasalPricesStep(input)
    const updated = when(
      "has-nasal-price-restorations",
      prepared,
      (data) => data.variants.length > 0,
    ).then(() =>
      updateProductVariantsWorkflow.runAsStep({
        input: transform(prepared, (data) => ({
          product_variants: data.variants,
        })),
      }),
    )
    when(
      "has-nasal-price-metadata",
      prepared,
      (data) => data.products.length > 0,
    ).then(() =>
      updateProductsWorkflow.runAsStep({
        input: transform({ prepared, updated }, ({ prepared: data }) => ({
          products: data.products,
        })),
      }),
    )
    return new WorkflowResponse(
      transform(prepared, (data) => ({
        updated: data.products.map((product) => product.id),
        variants: data.variants.length,
      })),
    )
  },
)
