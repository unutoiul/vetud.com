import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SALE_EXCLUDED_KEY } from "../lib/storewide-sale"
import { serumImageUrl, SKINCARE_SERUMS, SKINCARE_SERUMS_REVISION } from "../seed/skincare-serums"

/** Plans the missing serums; existing handles are left alone (Admin edits stay), so it can be repeated. */
const planSkincareSerumsStep = createStep(
  "plan-skincare-serums",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const [{ data: existing }, { data: categories }, { data: stores }, { data: profiles }] = await Promise.all([
      query.graph({ entity: "product", fields: ["handle"], filters: { handle: SKINCARE_SERUMS.map((serum) => serum.handle) } }),
      query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: [...new Set(SKINCARE_SERUMS.flatMap((serum) => serum.categories))] } }),
      query.graph({ entity: "store", fields: ["default_sales_channel_id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } }),
    ])
    const pending = SKINCARE_SERUMS.filter((serum) => !existing.some((row) => row.handle === serum.handle))
    const salesChannelId = stores[0]?.default_sales_channel_id
    const shippingProfileId = profiles[0]?.id
    if (pending.length && (!salesChannelId || !shippingProfileId)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Configure the default sales channel and shipping profile first.")
    if (pending.length) {
      const { data: clashes } = await query.graph({ entity: "product_variant", fields: ["sku"], filters: { sku: pending.map((serum) => serum.sku) } })
      if (clashes.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `SKU ${clashes[0].sku} already exists.`)
    }

    const products: CreateProductWorkflowInputDTO[] = pending.map((serum) => {
      const categoryIds = serum.categories.map((handle) => {
        const id = categories.find((row) => row.handle === handle)?.id
        if (!id) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${handle}`)
        return id
      })
      const image = serumImageUrl(serum.handle)
      return {
        title: serum.title,
        handle: serum.handle,
        subtitle: serum.subtitle,
        description: serum.description,
        status: ProductStatus.PUBLISHED,
        category_ids: categoryIds,
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId! }],
        thumbnail: image,
        images: [{ url: image }],
        metadata: {
          code: serum.code,
          brand: serum.brand,
          form: "Serum",
          contents: serum.contents,
          image_aspect_ratio: "1 / 1",
          catalog_revision: SKINCARE_SERUMS_REVISION,
          [SALE_EXCLUDED_KEY]: true,
        },
        options: [{ title: "Size", values: [serum.size] }],
        variants: [{
          title: serum.size,
          sku: serum.sku,
          manage_inventory: false,
          allow_backorder: false,
          options: { Size: serum.size },
          prices: [{ currency_code: "usd", amount: serum.usd }],
        }],
      }
    })
    return new StepResponse({ products, skipped: SKINCARE_SERUMS.filter((serum) => !pending.includes(serum)).map((serum) => serum.handle) })
  }
)

/** Adds the retail skincare serums, published, at full price (they're kept out of the storewide sale). */
export const importSkincareSerumsWorkflow = createWorkflow(
  "import-skincare-serums",
  function (input: Record<string, never>) {
    const plan = planSkincareSerumsStep(input)
    const created = when("has-new-skincare-serums", plan, (data) => data.products.length > 0).then(() =>
      createProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.products })) })
    )
    return new WorkflowResponse(transform({ plan, created }, ({ plan: data, created: products }) => ({
      created: (products ?? []).map((product) => product.handle),
      skipped: data.skipped,
    })))
  }
)
