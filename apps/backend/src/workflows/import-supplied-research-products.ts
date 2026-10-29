import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductCategoriesWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { BEAUTY_CATEGORY } from "../seed/research-categories"
import { PRODUCT_IMAGE_ORIGIN, SUPPLIED_PRODUCTS_REVISION, SUPPLIED_RESEARCH_PRODUCTS } from "../seed/supplied-research-products"

const prepareSuppliedProductsStep = createStep(
  "prepare-supplied-products",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const [{ data: existing }, { data: categories }, { data: stores }, { data: profiles }] = await Promise.all([
      query.graph({ entity: "product", fields: ["id", "handle"], filters: { handle: SUPPLIED_RESEARCH_PRODUCTS.map(product => product.handle) } }),
      query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: [...new Set(SUPPLIED_RESEARCH_PRODUCTS.flatMap(product => [...product.categoryHandles]))] } }),
      query.graph({ entity: "store", fields: ["default_sales_channel_id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } }),
    ])
    const products = SUPPLIED_RESEARCH_PRODUCTS.filter(product => !existing.some(current => current.handle === product.handle))
    const required = [...new Set(products.flatMap(product => [...product.categoryHandles]))]
    if (products.length && (!stores[0]?.default_sales_channel_id || !profiles[0])) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Configure the default sales channel and shipping profile before importing products.")
    }
    for (const handle of required) {
      if (handle !== BEAUTY_CATEGORY.handle && !categories.some(category => category.handle === handle)) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${handle}`)
      }
    }
    if (products.length) {
      const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "sku"], filters: { sku: products.map(product => product.sku) } })
      if (variants.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A supplied kit SKU already belongs to another product.")
    }
    return new StepResponse({
      products,
      categories,
      skipped: existing.map(product => product.handle),
      needsBeauty: !categories.some(category => category.handle === BEAUTY_CATEGORY.handle),
      salesChannelId: stores[0]?.default_sales_channel_id,
      shippingProfileId: profiles[0]?.id,
    })
  }
)

const planSuppliedProductsStep = createStep(
  "plan-supplied-products",
  async (input: {
    products: typeof SUPPLIED_RESEARCH_PRODUCTS[number][]
    categories: { id: string; handle: string | null }[]
    salesChannelId?: string | null
    shippingProfileId?: string
  }) => {
    const ids = new Map(input.categories.map(category => [category.handle, category.id]))
    const products: CreateProductWorkflowInputDTO[] = input.products.map(product => {
      const categoryIds = product.categoryHandles.map(handle => {
        const id = ids.get(handle)
        if (!id) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${handle}`)
        return id
      })
      const images = ["closed", "open"].map(view => ({ url: `${PRODUCT_IMAGE_ORIGIN}/images/products/${product.handle}-${view}.webp` }))
      return {
        title: product.title,
        handle: product.handle,
        subtitle: product.subtitle,
        description: product.description,
        status: ProductStatus.DRAFT,
        category_ids: categoryIds,
        shipping_profile_id: input.shippingProfileId,
        sales_channels: [{ id: input.salesChannelId! }],
        thumbnail: images[0].url,
        images,
        metadata: {
          code: product.code,
          brand: "VETUD",
          form: "Research pen kit",
          image_aspect_ratio: "4 / 3",
          image_packaging_amount: product.amount,
          contents: `1 × ${product.amount} pen; 12 disposable needles; 1 instruction booklet`,
          research_use_only: true,
          catalog_revision: SUPPLIED_PRODUCTS_REVISION,
          pricing_status: "draft_proposal",
          inventory_status: "awaiting_confirmation",
          specifications_status: "awaiting_manufacturer_data",
          ...(product.handle === "melanotan" ? { melanotan_subtype: "unspecified" } : {}),
          ...(product.researchSource ? { research_source: product.researchSource } : {}),
        },
        options: [{ title: "Amount", values: [product.amount] }],
        variants: [{
          title: product.amount,
          sku: product.sku,
          manage_inventory: true,
          allow_backorder: false,
          options: { Amount: product.amount },
          prices: [{ currency_code: "usd", amount: product.usd }, { currency_code: "eur", amount: product.eur }],
        }],
      }
    })
    return new StepResponse(products)
  }
)

/** Create missing drafts only; repeated imports preserve later edits, prices, stock and publication decisions. */
export const importSuppliedResearchProductsWorkflow = createWorkflow(
  "import-supplied-research-products",
  function (input: Record<string, never>) {
    const prepared = prepareSuppliedProductsStep(input)
    const beauty = when("needs-beauty-category", prepared, data => data.needsBeauty).then(() =>
      createProductCategoriesWorkflow.runAsStep({ input: transform(prepared, () => ({ product_categories: [{ ...BEAUTY_CATEGORY, rank: 11, is_active: true, is_internal: false, metadata: { storefront_group: "research" } }] })) })
    )
    const products = planSuppliedProductsStep(transform({ prepared, beauty }, ({ prepared: data, beauty: created }) => ({
      products: data.products,
      categories: [...data.categories, ...(created ?? [])],
      salesChannelId: data.salesChannelId,
      shippingProfileId: data.shippingProfileId,
    })))
    const created = when("has-new-supplied-products", products, data => data.length > 0).then(() =>
      createProductsWorkflow.runAsStep({ input: transform(products, data => ({ products: data })) })
    )
    return new WorkflowResponse(transform({ prepared, created }, ({ prepared: data, created: products }) => ({
      created: (products ?? []).map(product => ({ id: product.id, handle: product.handle, status: product.status })),
      skipped: data.skipped,
      beautyCreated: data.needsBeauty,
    })))
  }
)
