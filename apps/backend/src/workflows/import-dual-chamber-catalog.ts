import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  DUAL_CHAMBER_PRODUCTS, DUAL_CHAMBER_REVISION, FORMATS, FORMAT_CONTENTS, imageUrl,
  REPLACED_SUFFIX, RETIRED_HANDLES, variantSku, variantTitle, type DualChamberProduct, type FormatKey,
} from "../seed/dual-chamber-catalog"
import { BASE_CURRENCY } from "../lib/currencies"
import { catalogFormatAllowed, NASAL_RESEARCH_HANDLES, OPTIONAL_VIAL_ACCESSORIES_SCOPE, optionalVialAccessoriesAllowed, PRODUCT_FORMAT_REVIEW, RESEARCH_VIAL_CONTENTS } from "../lib/product-format-review"

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

/** New variants get their USD price; the other currencies follow from workflows/sync-currency-prices.ts. */
export const usdPrice = (amount: number) => [{ currency_code: BASE_CURRENCY, amount }]

function productInput(
  product: DualChamberProduct,
  context: { categoryIds: Map<string, string>; salesChannelId: string; shippingProfileId: string; previous?: ExistingProduct },
): CreateProductWorkflowInputDTO {
  const formats = (["pen", "vial"] as FormatKey[]).filter((format) => product[format].length && catalogFormatAllowed(product.handle, FORMATS[format]))
  const amounts = [...new Set(formats.flatMap((format) => product[format].map((offer) => offer.amount)))]
  const carried = Object.fromEntries(Object.entries(context.previous?.metadata ?? {}).filter(([key]) => CARRIED_KEYS.includes(key)))
  const nasal = (NASAL_RESEARCH_HANDLES as readonly string[]).includes(product.handle)
  const images = formats.map(format => imageUrl(product.handle, format)).map(url => ({ url }))
  const onlyVial = product.handle === "decapeptide-12"
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
      // The boxed format (pen kit box or nasal spray) follows in the same deploy; see add-pen-kit-boxes.
      form: onlyVial ? "Research vial" : nasal ? "Nasal spray, dual-chamber vial or vial" : product.handle === "bacteriostatic-water" ? "Dual-chamber vial or vial" : "Dual-chamber vial, vial or pen kit box",
      image_aspect_ratio: "1 / 1",
      contents_pen: onlyVial ? null : product.contents?.pen ?? FORMAT_CONTENTS.pen,
      contents_vial: onlyVial ? RESEARCH_VIAL_CONTENTS : product.contents?.vial ?? FORMAT_CONTENTS.vial,
      format_line_vial: product.handle === "bacteriostatic-water" ? "Bottled laboratory research diluent" : "Sealed research vial; no diluent or administration supplies included",
      preparation_addons_allowed: optionalVialAccessoriesAllowed(product.handle),
      preparation_addons_scope: OPTIONAL_VIAL_ACCESSORIES_SCOPE,
      preparation_addons_basis: "Optional laboratory accessories only. The research protocol must specify diluent compatibility and supplies; no injection suitability is established.",
      injection_format_verified: false,
      format_review_revision: PRODUCT_FORMAT_REVIEW,
      allowed_formats: onlyVial ? ["Vial"] : [...formats.map(format => FORMATS[format]), ...(nasal ? ["Nasal spray"] : product.handle === "bacteriostatic-water" ? [] : ["Pen kit box"])],
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
      prices: usdPrice(offer.usd),
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
    const skus = pending.flatMap((product) => (["pen", "vial"] as FormatKey[]).filter(format => catalogFormatAllowed(product.handle, FORMATS[format])).flatMap((format) => product[format].map((offer) => variantSku(product, format, offer.amount))))
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
    const categoryIds = new Map(categories.map((category) => [category.handle as string, category.id]))
    const products = pending.map((product) => productInput(product, {
      categoryIds,
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
