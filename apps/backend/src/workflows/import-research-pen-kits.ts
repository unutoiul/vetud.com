import { readFileSync } from "fs"
import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
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
  updateProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { findProductAsset } from "../seed/product-images"
import {
  RESEARCH_PEN_KITS,
  RESEARCH_PEN_KIT_REVISION,
} from "../seed/research-pen-kits"

const preparePenKitsStep = createStep(
  "prepare-pen-kits",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "metadata"],
      filters: { handle: RESEARCH_PEN_KITS.map((kit) => kit.handle) },
    })
    const existing = new Map(
      products.map((product) => [product.handle, product])
    )
    const kits = RESEARCH_PEN_KITS.filter(
      (kit) =>
        existing.get(kit.handle)?.metadata?.catalog_revision !==
        RESEARCH_PEN_KIT_REVISION
    ).map((kit) => ({
      ...kit,
      id: existing.get(kit.handle)?.id,
      metadata: { ...existing.get(kit.handle)?.metadata, ...kit.metadata },
    }))

    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: "peptide-series" },
    })
    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id"],
      filters: { handle: "featured" },
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
      kits.some((kit) => !kit.id) &&
      (!categories[0] || !profiles[0] || !stores[0]?.default_sales_channel_id)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Seed the Medusa store before importing the research pen kits."
      )
    }

    // Read every asset before uploading anything, so a missing photo cannot leave a partial import.
    const files = kits.flatMap((kit) =>
      kit.images.map((filename) => {
        const asset = findProductAsset(filename)
        if (!asset)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Missing product image: ${filename}`
          )
        return {
          filename,
          mimeType: "image/png",
          content: readFileSync(asset).toString("base64"),
          access: "public" as const,
        }
      })
    )

    return new StepResponse({
      kits,
      files,
      categoryId: categories[0]?.id,
      collectionId: collections[0]?.id,
      shippingProfileId: profiles[0]?.id,
      salesChannelId: stores[0]?.default_sales_channel_id,
    })
  }
)

/** Updates matching products in place; missing products start as drafts with no prices or stock. */
export const importResearchPenKitsWorkflow = createWorkflow(
  "import-research-pen-kits",
  (input: Record<string, never>) => {
    const prepared = preparePenKitsStep(input)
    const files = when(
      "has-pen-kit-changes",
      prepared,
      (data) => data.kits.length > 0
    ).then(() => {
      return uploadFilesWorkflow.runAsStep({
        input: transform(prepared, (data) => ({ files: data.files })),
      })
    })
    const payload = transform(
      { prepared, files },
      ({ prepared: data, files: uploaded }) => {
        const urls = new Map<string, string>(
          (uploaded ?? []).map((file, index) => [
            data.files[index].filename,
            file.url,
          ] as const)
        )
        const creates: CreateProductWorkflowInputDTO[] = []
        const updates: {
          id: string
          title: string
          subtitle: string
          description: string
          thumbnail: string
          images: { url: string }[]
          metadata: Record<string, unknown>
        }[] = []
        for (const kit of data.kits) {
          const details = {
            title: kit.title,
            subtitle: kit.subtitle,
            description: kit.description,
            thumbnail: urls.get(kit.images[0])!,
            images: kit.images.map((filename) => ({
              url: urls.get(filename)!,
            })),
            metadata: kit.metadata,
          }
          if (kit.id) {
            // Keep existing variants, prices, inventory, status and order references intact.
            updates.push({ id: kit.id, ...details })
          } else {
            creates.push({
              ...details,
              handle: kit.handle,
              status: ProductStatus.DRAFT,
              category_ids: [data.categoryId!],
              collection_id: data.collectionId,
              shipping_profile_id: data.shippingProfileId,
              sales_channels: [{ id: data.salesChannelId! }],
              options: [{ title: "Amount", values: ["40 mg"] }],
              variants: [
                {
                  title: "40 mg",
                  sku: `${kit.code}-40MG`,
                  manage_inventory: true,
                  allow_backorder: false,
                  options: { Amount: "40 mg" },
                  prices: [],
                },
              ],
            })
          }
        }
        return { creates, updates }
      }
    )
    when("has-new-pen-kits", payload, (data) => data.creates.length > 0).then(
      () => {
        createProductsWorkflow.runAsStep({
          input: transform(payload, (data) => ({ products: data.creates })),
        })
      }
    )
    when(
      "has-existing-pen-kits",
      payload,
      (data) => data.updates.length > 0
    ).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform(payload, (data) => ({ products: data.updates })),
      })
    })
    return new WorkflowResponse(
      transform(prepared, (data) => ({
        created: data.kits.filter((kit) => !kit.id).map((kit) => kit.handle),
        updated: data.kits.filter((kit) => kit.id).map((kit) => kit.handle),
      }))
    )
  }
)
