import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { LAB_SUPPLIES, LAB_SUPPLIES_REVISION, LAB_SUPPLY_IMAGE_ORIGIN } from "../seed/lab-supplies"
import { usdPrice } from "./import-dual-chamber-catalog"

/** Plans the missing lab supplies; existing handles are left alone, so it can be repeated. */
const planLabSuppliesStep = createStep(
  "plan-lab-supplies",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const [{ data: existing }, { data: categories }, { data: stores }, { data: profiles }] = await Promise.all([
      query.graph({ entity: "product", fields: ["handle"], filters: { handle: LAB_SUPPLIES.map((supply) => supply.handle) } }),
      query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: [...new Set(LAB_SUPPLIES.map((supply) => supply.category))] } }),
      query.graph({ entity: "store", fields: ["default_sales_channel_id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } }),
    ])
    const pending = LAB_SUPPLIES.filter((supply) => !existing.some((row) => row.handle === supply.handle))
    const salesChannelId = stores[0]?.default_sales_channel_id
    const shippingProfileId = profiles[0]?.id
    if (pending.length && (!salesChannelId || !shippingProfileId)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Configure the default sales channel and shipping profile first.")
    if (pending.length) {
      const { data: clashes } = await query.graph({ entity: "product_variant", fields: ["sku"], filters: { sku: pending.flatMap((supply) => supply.variants.map((variant) => variant.sku)) } })
      if (clashes.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `SKU ${clashes[0].sku} already exists.`)
    }

    const products: CreateProductWorkflowInputDTO[] = pending.map((supply) => {
      const category = categories.find((row) => row.handle === supply.category)
      if (!category) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${supply.category}`)
      const images = supply.images.map((view) => ({ url: `${LAB_SUPPLY_IMAGE_ORIGIN}/images/products/${supply.handle}-${view}.webp` }))
      return {
        title: supply.title,
        handle: supply.handle,
        subtitle: supply.subtitle,
        description: supply.description,
        status: ProductStatus.PUBLISHED,
        category_ids: [category.id],
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId! }],
        thumbnail: images[0].url,
        images,
        metadata: { code: supply.code, brand: "VETUD", form: "Laboratory supply", contents: supply.contents, image_aspect_ratio: "1 / 1", catalog_revision: LAB_SUPPLIES_REVISION },
        options: [{ title: "Pack", values: supply.variants.map((variant) => variant.title) }],
        variants: supply.variants.map((variant) => ({
          title: variant.title,
          sku: variant.sku,
          manage_inventory: false,
          allow_backorder: false,
          options: { Pack: variant.title },
          prices: usdPrice(variant.usd),
        })),
      }
    })
    return new StepResponse({ products, skipped: LAB_SUPPLIES.filter((supply) => !pending.includes(supply)).map((supply) => supply.handle) })
  }
)

/** Adds the lab supplies (U-100 syringes) to the Laboratory supplies shelf, published. */
export const importLabSuppliesWorkflow = createWorkflow(
  "import-lab-supplies",
  function (input: Record<string, never>) {
    const plan = planLabSuppliesStep(input)
    const created = when("has-new-lab-supplies", plan, (data) => data.products.length > 0).then(() =>
      createProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.products })) })
    )
    return new WorkflowResponse(transform({ plan, created }, ({ plan: data, created: products }) => ({
      created: (products ?? []).map((product) => product.handle),
      skipped: data.skipped,
    })))
  }
)
