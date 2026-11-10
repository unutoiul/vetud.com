import { readFileSync } from "fs"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
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
  createProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { findProductAsset } from "../seed/product-images"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"

const prepareNasalSpraysStep = createStep(
  "prepare-nasal-sprays",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: existing } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
      filters: { handle: NASAL_SPRAYS.map((product) => product.handle) },
    })
    // Existing products may have received later formula, stock or price edits in Admin.
    const products = NASAL_SPRAYS.filter(
      (product) => !existing.some((item) => item.handle === product.handle)
    )
    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: "peptide-series" },
    })
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["default_sales_channel_id"],
    })
    const { data: profiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    })
    if (
      products.length &&
      (!categories[0] || !stores[0]?.default_sales_channel_id || !profiles[0])
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Seed the Medusa store before importing nasal sprays."
      )
    }
    const { data: existingSkus } = await query.graph({
      entity: "product_variant",
      fields: ["sku"],
      filters: { sku: products.map((product) => `${product.code}-10ML`) },
    })
    if (existingSkus.length)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A nasal spray SKU is already assigned to another product."
      )
    // Preflight every image before starting uploads or creating products.
    const files = products.flatMap((product) =>
      product.images.map((filename) => {
        const file = findProductAsset(filename)
        if (!file)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Missing product image: ${filename}`
          )
        return {
          filename,
          mimeType: "image/png",
          content: readFileSync(file).toString("base64"),
          access: "public" as const,
        }
      })
    )
    return new StepResponse({
      products,
      files,
      categoryId: categories[0]?.id,
      salesChannelId: stores[0]?.default_sales_channel_id,
      shippingProfileId: profiles[0]?.id,
      skipped: existing.map((product) => product.handle),
    })
  }
)

/** Creates drafts with provisional USD prices; no concentration, inactive ingredients or stock are invented. */
export const importResearchNasalSpraysWorkflow = createWorkflow(
  "import-research-nasal-sprays",
  (input: Record<string, never>) => {
    const prepared = prepareNasalSpraysStep(input)
    const uploaded = when(
      "has-nasal-spray-images",
      prepared,
      (data) => data.products.length > 0
    ).then(() => {
      return uploadFilesWorkflow.runAsStep({
        input: transform(prepared, (data) => ({ files: data.files })),
      })
    })
    when(
      "has-new-nasal-sprays",
      prepared,
      (data) => data.products.length > 0
    ).then(() => {
      createProductsWorkflow.runAsStep({
        input: transform(
          { prepared, uploaded },
          ({ prepared: data, uploaded: files }) => {
            const urls = new Map<string, string>(
              (files ?? []).map(
                (file, index) => [data.files[index].filename, file.url] as const
              )
            )
            return {
              products: data.products.map((product) => ({
                title: product.title,
                handle: product.handle,
                subtitle: product.subtitle,
                description: product.description,
                status: ProductStatus.DRAFT,
                category_ids: [data.categoryId!],
                sales_channels: [{ id: data.salesChannelId! }],
                shipping_profile_id: data.shippingProfileId,
                thumbnail: urls.get(product.images[0])!,
                images: product.images.map((filename) => ({
                  url: urls.get(filename)!,
                })),
                metadata: product.metadata,
                options: [{ title: "Volume", values: ["10 ml"] }],
                variants: [
                  {
                    title: "10 ml",
                    sku: `${product.code}-10ML`,
                    options: { Volume: "10 ml" },
                    manage_inventory: true,
                    allow_backorder: false,
                    prices: [{ currency_code: "usd", amount: product.usd }],
                  },
                ],
              })),
            }
          }
        ),
      })
    })
    return new WorkflowResponse(
      transform(prepared, (data) => ({
        created: data.products.map((product) => product.handle),
        skipped: data.skipped,
      }))
    )
  }
)
