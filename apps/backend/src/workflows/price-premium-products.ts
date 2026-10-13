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
  PREMIUM_EUR_RATES,
  PREMIUM_FX_DATE,
  PREMIUM_FX_SOURCE,
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
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["currency_code"],
    })
    const currencies = [
      ...new Set(regions.map((region) => region.currency_code)),
    ].sort()
    for (const currency of currencies) {
      if (!(PREMIUM_EUR_RATES[currency] > 0))
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Missing exchange rate: ${currency}`,
        )
    }
    if (!currencies.includes("usd") || !currencies.includes("eur"))
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "USD and EUR markets are required.",
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
      filters: { handle: PREMIUM_PRICE_HANDLES },
    })
    const products: { id: string; metadata: Record<string, unknown> }[] = []
    const variants: UpdateProductVariantWorkflowInputDTO[] = []
    const summary: {
      handle: string
      title: string
      prices: Record<string, number>
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
        const usd = basePrices.filter((price) => price.currency_code === "usd")
        if (usd.length !== 1 || !(Number(usd[0].amount) > 0))
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `${handle} ${variant.title} needs one positive base USD price.`,
          )
        const amounts: Record<string, number> = {}
        for (const currency of currencies) {
          const existing = basePrices.filter(
            (price) => price.currency_code === currency,
          )
          if (existing.length > 1)
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `${handle} ${variant.title} has multiple base ${currency.toUpperCase()} prices.`,
            )
          if (existing[0]) {
            const amount = Number(existing[0].amount)
            if (!(Number.isFinite(amount) && amount > 0))
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Invalid ${currency} price for ${handle} ${variant.title}`,
              )
            amounts[currency] =
              Math.round(amount * PREMIUM_PRICE_MULTIPLIER * 100) / 100
          }
        }
        // Existing regional retail prices double exactly. Missing EUR prices come from the new USD
        // price; the EUR anchor also lets the existing nightly conversion job keep other markets current.
        amounts.eur ??= Math.ceil(amounts.usd / PREMIUM_EUR_RATES.usd)
        for (const currency of currencies)
          amounts[currency] ??= Math.round(
            amounts.eur * PREMIUM_EUR_RATES[currency],
          )

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
                isBasePrice(price) && amounts[price.currency_code] !== undefined
                  ? amounts[price.currency_code]
                  : price.amount,
              min_quantity: price.min_quantity,
              max_quantity: price.max_quantity,
              ...(Object.keys(rules).length ? { rules } : {}),
            }
          })
        for (const currency of currencies) {
          if (!basePrices.some((price) => price.currency_code === currency))
            prices.push({ currency_code: currency, amount: amounts[currency] })
        }
        variants.push({ id: variant.id, prices })
        summary.push({ handle, title: variant.title, prices: amounts })
      }
      products.push({
        id: product.id,
        metadata: {
          ...product.metadata,
          retail_pricing_revision: PREMIUM_PRICE_REVISION,
          retail_pricing_multiplier: PREMIUM_PRICE_MULTIPLIER,
          retail_pricing_note:
            "User-requested 100% increase of existing retail prices; missing currencies added using the EUR anchor and recorded exchange rates.",
          retail_pricing_fx_date: PREMIUM_FX_DATE,
          retail_pricing_fx_source: PREMIUM_FX_SOURCE,
          retail_pricing_fx_rates: PREMIUM_EUR_RATES,
        },
      })
    }
    return new StepResponse({ products, variants, summary, currencies })
  },
)

/** Doubles retail prices once and makes all current market currencies available, without altering stock. */
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
        currencies: data.currencies,
      })),
    )
  },
)
