import type { UpdateProductVariantWorkflowInputDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
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
  createProductVariantsDefaultInventoryStep,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  PEN_KIT_AMOUNTS,
  US_PEN_KIT_PRICES,
  US_PEN_KIT_PRICING_DATE,
  US_PEN_KIT_PRICING_REVISION,
} from "../seed/research-pen-kit-prices"
import { PRODUCT_TESTING_LABEL } from "../seed/product-care"

type ProductRow = {
  id: string
  title: string
  handle: string
  metadata?: Record<string, unknown> | null
  options: {
    id: string
    title: string
    values: { id: string; value: string }[]
  }[]
  variants: {
    id: string
    title: string
    price_set?: {
      prices: {
        id: string
        currency_code: string
        amount: number
        price_list_id?: string | null
        rules_count?: number
      }[]
    }
  }[]
}

const preparePenKitPricesStep = createStep(
  "prepare-pen-kit-prices",
  async (_input: Record<string, never>, { container }) => {
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "metadata",
          "options.id",
          "options.title",
          "options.values.id",
          "options.values.value",
          "variants.id",
          "variants.title",
          "variants.price_set.prices.*",
        ],
        filters: { handle: US_PEN_KIT_PRICES.map((kit) => kit.handle) },
      })
    const existing = new Map(
      (data as unknown as ProductRow[]).map((product) => [
        product.handle,
        product,
      ]),
    )
    const products: {
      id: string
      subtitle: string
      description: string
      metadata: Record<string, unknown>
      variants: UpdateProductVariantWorkflowInputDTO[]
    }[] = []
    const optionUpdates: {
      product_id: string
      product_option_id: string
      previousIds: string[]
      add: { value: string }[]
    }[] = []
    const summary: { handle: string; amounts: number[]; usd: number[] }[] = []

    for (const kit of US_PEN_KIT_PRICES) {
      const product = existing.get(kit.handle)
      if (!product)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Import ${kit.handle} before setting its variants and prices.`,
        )
      if (product.metadata?.us_pricing_revision === US_PEN_KIT_PRICING_REVISION)
        continue
      const option = product.options.find((option) => option.title === "Amount")
      if (!option)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${kit.handle} has no Amount option.`,
        )
      const missing = PEN_KIT_AMOUNTS.map((amount) => `${amount} mg`).filter(
        (value) => !option.values.some((existing) => existing.value === value),
      )
      if (missing.length)
        optionUpdates.push({
          product_id: product.id,
          product_option_id: option.id,
          previousIds: option.values.map((value) => value.id),
          add: missing.map((value) => ({ value })),
        })

      const variants: UpdateProductVariantWorkflowInputDTO[] =
        product.variants.map((variant) => ({ id: variant.id }))
      for (const amount of PEN_KIT_AMOUNTS) {
        const title = `${amount} mg`
        const variant = product.variants.find(
          (variant) =>
            variant.title.replace(/\s+/g, "").toLowerCase() === `${amount}mg`,
        )
        if (variant) {
          const oldPrices = variant.price_set?.prices ?? []
          // Retain every existing price by ID. Only the unconditional USD retail price changes.
          const prices = oldPrices.map((price) => ({
            id: price.id,
            currency_code: price.currency_code,
            amount: price.amount,
          }))
          const baseUsd = oldPrices.filter(
            (price) =>
              price.currency_code === "usd" &&
              !price.price_list_id &&
              !price.rules_count,
          )
          if (baseUsd.length > 1)
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `${kit.handle} ${title} has multiple base USD prices.`,
            )
          if (baseUsd[0])
            prices.find((price) => price.id === baseUsd[0].id)!.amount =
              kit.prices[amount]
          const newPrices = baseUsd.length
            ? prices
            : [...prices, { currency_code: "usd", amount: kit.prices[amount] }]
          const update = variants.find((update) => update.id === variant.id)!
          Object.assign(update, { title, prices: newPrices })
        } else {
          variants.push({
            title,
            sku: `${kit.skuPrefix}-${amount}MG`,
            manage_inventory: true,
            allow_backorder: false,
            options: { Amount: title },
            prices: [{ currency_code: "usd", amount: kit.prices[amount] }],
          })
        }
      }
      products.push({
        id: product.id,
        subtitle: "Research peptide · 10 mg / 20 mg / 40 mg pen kits",
        description:
          `VETUD ${product.title} research pen kit, available in 10 mg, 20 mg and 40 mg amounts. ` +
          "Kit contents: one pen in the selected amount, 12 disposable needles and one instruction booklet. " +
          `Labeled for research use only. 99% purity. ${PRODUCT_TESTING_LABEL}. ` +
          "The current product images show 40 mg packaging for all amount options; select the required amount from the variant selector.",
        metadata: {
          ...product.metadata,
          form: "Pen kit",
          contents:
            "1 pen in the selected amount; 12 disposable needles; 1 instruction booklet",
          available_amounts: "10 mg; 20 mg; 40 mg",
          image_packaging_amount: "40 mg",
          us_pricing_revision: US_PEN_KIT_PRICING_REVISION,
          us_pricing_researched_at: US_PEN_KIT_PRICING_DATE,
          us_pricing_sources: kit.sources.join("; "),
          us_pricing_note: kit.note,
        },
        variants,
      })
      summary.push({
        handle: kit.handle,
        amounts: [...PEN_KIT_AMOUNTS],
        usd: PEN_KIT_AMOUNTS.map((amount) => kit.prices[amount]),
      })
    }
    return new StepResponse({
      products,
      optionUpdates,
      summary,
      productIds: [...existing.values()].map((product) => product.id),
    })
  },
)

type OptionUpdate = {
  product_id: string
  product_option_id: string
  previousIds: string[]
  add: { value: string }[]
}
type OptionRollback = {
  product_id: string
  product_option_id: string
  remove: string[]
}

const expandPenKitAmountsStep = createStep(
  "expand-pen-kit-amounts",
  async (updates: OptionUpdate[], { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)
    await productModule.updateProductOptionValuesOnProduct(
      updates.map(({ previousIds: _previousIds, ...update }) => update),
    )
    const rollback: OptionRollback[] = []
    for (const update of updates) {
      const product = await productModule.retrieveProduct(update.product_id, {
        relations: ["options", "options.values"],
      })
      const option = product.options?.find(
        (option) => option.id === update.product_option_id,
      )
      rollback.push({
        product_id: update.product_id,
        product_option_id: update.product_option_id,
        remove: (option?.values ?? [])
          .filter((value) => !update.previousIds.includes(value.id))
          .map((value) => value.id),
      })
    }
    return new StepResponse({ ready: true }, rollback)
  },
  async (rollback: OptionRollback[] | undefined, { container }) => {
    if (rollback?.length)
      await container
        .resolve(Modules.PRODUCT)
        .updateProductOptionValuesOnProduct(rollback)
  },
)

const getPenKitVariantIdsStep = createStep(
  "get-pen-kit-variant-ids",
  async (productIds: string[], { container }) => {
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product_variant",
        fields: ["id", "manage_inventory"],
        filters: { product_id: productIds },
      })
    return new StepResponse(
      data
        .filter((variant) => variant.manage_inventory)
        .map((variant) => variant.id),
    )
  },
)

/** Adds amounts and US prices once, preserving image URLs, stock, publication status and non-USD prices. */
export const priceResearchPenKitsWorkflow = createWorkflow(
  "price-research-pen-kits",
  (input: Record<string, never>) => {
    const prepared = preparePenKitPricesStep(input)
    const expanded = expandPenKitAmountsStep(
      transform(prepared, (data) => data.optionUpdates),
    )
    const updated = when(
      "has-pen-kit-pricing-changes",
      prepared,
      (data) => data.products.length > 0,
    ).then(() => {
      return updateProductsWorkflow.runAsStep({
        input: transform({ prepared, expanded }, ({ prepared }) => ({
          products: prepared.products,
        })),
      })
    })
    const variantIds = getPenKitVariantIdsStep(
      transform({ prepared, updated }, ({ prepared }) => prepared.productIds),
    )
    // Product updates don't create inventory for newly generated variant IDs. Ensure those links
    // after the update; the core step skips existing links and never assigns stock quantities.
    createProductVariantsDefaultInventoryStep({ variantIds })
    return new WorkflowResponse(
      transform(prepared, (data) => ({ updated: data.summary })),
    )
  },
)
