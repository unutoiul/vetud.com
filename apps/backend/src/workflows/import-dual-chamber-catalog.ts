import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  DUAL_CHAMBER_PRODUCTS, DUAL_CHAMBER_REVISION, EXPLAINER_IMAGE, FORMAT_CONTENTS, FORMATS, imageUrl,
  REPLACED_SUFFIX, RETIRED_HANDLES, variantSku, variantTitle, type DualChamberProduct, type FormatKey,
} from "../seed/dual-chamber-catalog"
import { WHOLE_UNIT_CURRENCIES } from "../seed/supplied-research-publication"

type ExchangeService = { getExchangeRates: (base: string) => Promise<Record<string, number>> }

type ExistingProduct = {
  id: string
  handle: string
  status: string
  collection_id?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Metadata carried over from the product being replaced: lot records and the quality notes that
 * belong to the compound. Format-specific keys (contents, features, pricing notes) are not.
 */
const CARRIED_KEYS = ["lots", "purity", "testing", "storage", "handling", "research_source", "research_sources"]

function regionalPrices(usd: number, eur: number, currencies: string[], rates: Record<string, number>) {
  return currencies.map((currency) => {
    if (currency === "usd") return { currency_code: currency, amount: usd }
    if (currency === "eur") return { currency_code: currency, amount: eur }
    const rate = rates[currency]
    if (!rate || !Number.isFinite(rate) || rate <= 0) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Missing exchange rate for ${currency.toUpperCase()}.`)
    const amount = eur * rate
    return { currency_code: currency, amount: WHOLE_UNIT_CURRENCIES.has(currency) ? Math.round(amount) : Math.round(amount * 100) / 100 }
  })
}

function productInput(
  product: DualChamberProduct,
  context: { categoryIds: Map<string, string>; currencies: string[]; rates: Record<string, number>; salesChannelId: string; shippingProfileId: string; previous?: ExistingProduct },
): CreateProductWorkflowInputDTO {
  const formats = (["pen", "vial"] as FormatKey[]).filter((format) => product[format].length)
  const amounts = [...new Set(formats.flatMap((format) => product[format].map((offer) => offer.amount)))]
  const carried = Object.fromEntries(Object.entries(context.previous?.metadata ?? {}).filter(([key]) => CARRIED_KEYS.includes(key)))
  const images = [imageUrl(product.handle, "pen"), imageUrl(product.handle, "vial"), EXPLAINER_IMAGE()].map((url) => ({ url }))
  return {
    title: product.title,
    handle: product.handle,
    subtitle: product.summary,
    description: product.description,
    status: ProductStatus.PUBLISHED,
    category_ids: product.categories.map((handle) => {
      const id = context.categoryIds.get(handle)
      if (!id) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${handle}`)
      return id
    }),
    collection_id: context.previous?.collection_id ?? undefined,
    shipping_profile_id: context.shippingProfileId,
    sales_channels: [{ id: context.salesChannelId }],
    thumbnail: images[0].url,
    images,
    metadata: {
      ...carried,
      code: product.code,
      brand: "VETUD",
      form: "Dual-chamber pen or vial",
      image_aspect_ratio: "1 / 1",
      contents_pen: product.contents?.pen ?? FORMAT_CONTENTS.pen,
      contents_vial: product.contents?.vial ?? FORMAT_CONTENTS.vial,
      ...(product.lines?.pen ? { format_line_pen: product.lines.pen } : {}),
      ...(product.lines?.vial ? { format_line_vial: product.lines.vial } : {}),
      research_use_only: true,
      catalog_revision: DUAL_CHAMBER_REVISION,
      ...(product.learn.length ? { learn_peptides: product.learn } : {}),
    },
    options: [
      { title: "Format", values: formats.map((format) => FORMATS[format]) },
      { title: "Amount", values: amounts },
    ],
    variants: formats.flatMap((format) => product[format].map((offer) => ({
      title: variantTitle(format, offer.amount),
      sku: variantSku(product, format, offer.amount),
      manage_inventory: false,
      allow_backorder: false,
      options: { Format: FORMATS[format], Amount: offer.amount },
      prices: regionalPrices(offer.usd, offer.eur, context.currencies, context.rates),
      metadata: { format },
    }))),
  }
}

/**
 * Works out every change before anything is written. Products already at this revision are left
 * alone, so the import can be repeated; older versions of the same handles are replaced.
 */
const planDualChamberCatalogStep = createStep(
  "plan-dual-chamber-catalog",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const handles = DUAL_CHAMBER_PRODUCTS.map((product) => product.handle)
    const [{ data: existing }, { data: categories }, { data: stores }, { data: profiles }, { data: regions }, { data: retired }] = await Promise.all([
      query.graph({ entity: "product", fields: ["id", "handle", "status", "collection_id", "metadata"], filters: { handle: handles } }),
      query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: [...new Set(DUAL_CHAMBER_PRODUCTS.flatMap((product) => product.categories))] } }),
      query.graph({ entity: "store", fields: ["default_sales_channel_id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } }),
      query.graph({ entity: "region", fields: ["currency_code"] }),
      query.graph({ entity: "product", fields: ["id", "handle", "status"], filters: { handle: RETIRED_HANDLES } }),
    ])
    const current = existing as unknown as ExistingProduct[]
    const pending = DUAL_CHAMBER_PRODUCTS.filter((product) => current.find((row) => row.handle === product.handle)?.metadata?.catalog_revision !== DUAL_CHAMBER_REVISION)
    const replaced = current.filter((row) => pending.some((product) => product.handle === row.handle))
    // Only pre-dual-chamber products are moved aside; a later catalog revision needs its own update.
    const outdated = replaced.find((row) => String(row.metadata?.catalog_revision ?? "").startsWith("dual-chamber-"))
    if (outdated) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${outdated.handle} is from an earlier dual-chamber revision; update it in Admin instead.`)
    const salesChannelId = stores[0]?.default_sales_channel_id
    const shippingProfileId = profiles[0]?.id
    if (pending.length && (!salesChannelId || !shippingProfileId)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Configure the default sales channel and shipping profile before importing products.")
    }

    // The replaced products stay (as drafts), so a new SKU must not exist anywhere yet.
    const skus = pending.flatMap((product) => (["pen", "vial"] as FormatKey[]).flatMap((format) => product[format].map((offer) => variantSku(product, format, offer.amount))))
    if (new Set(skus).size !== skus.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "The catalog repeats a SKU.")
    if (skus.length) {
      const { data: clashes } = await query.graph({ entity: "product_variant", fields: ["sku"], filters: { sku: skus } })
      if (clashes.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `SKU ${clashes[0].sku} already belongs to another product.`)
    }
    const { data: taken } = replaced.length
      ? await query.graph({ entity: "product", fields: ["handle"], filters: { handle: replaced.map((row) => `${row.handle}${REPLACED_SUFFIX}`) } })
      : { data: [] }
    if (taken.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `The handle ${taken[0].handle} is already in use.`)

    const currencies = [...new Set(regions.map((region) => region.currency_code))].sort()
    const needsRates = pending.length > 0 && currencies.some((currency) => currency !== "usd" && currency !== "eur")
    const rates = needsRates ? await container.resolve<ExchangeService>("currencyExchangeService").getExchangeRates("eur") : {}
    const categoryIds = new Map(categories.map((category) => [category.handle as string, category.id]))
    const products = pending.map((product) => productInput(product, {
      categoryIds, currencies, rates,
      salesChannelId: salesChannelId!, shippingProfileId: shippingProfileId!,
      previous: replaced.find((row) => row.handle === product.handle),
    }))

    return new StepResponse({
      products,
      replacements: replaced.map((row) => ({ id: row.id, handle: `${row.handle}${REPLACED_SUFFIX}`, status: ProductStatus.DRAFT })),
      retireIds: retired.filter((row) => row.status !== ProductStatus.DRAFT).map((row) => row.id),
      summary: {
        created: pending.filter((product) => !replaced.some((row) => row.handle === product.handle)).map((product) => product.handle),
        replaced: replaced.map((row) => row.handle),
        unchanged: DUAL_CHAMBER_PRODUCTS.filter((product) => !pending.includes(product)).map((product) => product.handle),
        retired: retired.filter((row) => row.status !== ProductStatus.DRAFT).map((row) => row.handle),
        currencies,
      },
    })
  }
)

/**
 * Adds the 28 dual-chamber pen and vial products. Older versions of the same handles (pen kits and
 * nasal sprays) move to draft under `<handle>-pen-kit-2026`, with their variants, stock, reservations
 * and order history intact; the new product takes over the URL, collection, lots and quality notes.
 */
export const importDualChamberCatalogWorkflow = createWorkflow(
  "import-dual-chamber-catalog",
  function (input: Record<string, never>) {
    const plan = planDualChamberCatalogStep(input)
    when("has-replaced-products", plan, (data) => data.replacements.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.replacements })) }).config({ name: "move-replaced-products" })
    })
    when("has-dual-chamber-products", plan, (data) => data.products.length > 0).then(() => {
      createProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.products })) })
    })
    when("has-retired-products", plan, (data) => data.retireIds.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ selector: { id: data.retireIds }, update: { status: ProductStatus.DRAFT } })) })
    })
    return new WorkflowResponse(transform(plan, (data) => data.summary))
  }
)
