import { readFileSync } from "fs"
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
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { findProductAsset } from "../seed/product-images"

const prepareNasalSprayImagesStep = createStep(
  "prepare-nasal-spray-images",
  async (_input: Record<string, never>, { container }) => {
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product",
        fields: ["id", "handle", "metadata", "thumbnail", "images.url"],
        filters: { handle: NASAL_SPRAYS.map((product) => product.handle) },
      })
    const products = NASAL_SPRAYS.map((product) => {
      const current = data.find((item) => item.handle === product.handle)
      if (!current) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Missing product: ${product.handle}`,
        )
      }
      return { ...current, filenames: product.images }
    }).filter(
      (product) =>
        product.images?.length !== 2 ||
        !product.filenames.every((filename, index) =>
          product.images?.[index]?.url.endsWith(filename),
        ) ||
        !product.thumbnail?.endsWith(product.filenames[0]) ||
        product.metadata?.image_aspect_ratio !== "4 / 3",
    )
    // Verify every source image before uploading or updating either product.
    const files = products.flatMap((product) =>
      product.filenames.map((filename) => {
        const file = findProductAsset(filename)
        if (!file) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Missing studio image: ${filename}`,
          )
        }
        return {
          filename,
          mimeType: "image/png",
          content: readFileSync(file).toString("base64"),
          access: "public" as const,
        }
      }),
    )
    return new StepResponse({ products, files })
  },
)

/** Replaces only spray photos and their display ratio, preserving names, prices, stock and formulas. */
export const refreshNasalSprayImagesWorkflow = createWorkflow(
  "refresh-nasal-spray-images",
  (input: Record<string, never>) => {
    const prepared = prepareNasalSprayImagesStep(input)
    when(
      "has-spray-studio-image-updates",
      prepared,
      (data) => data.products.length > 0,
    ).then(() => {
      const uploaded = uploadFilesWorkflow.runAsStep({
        input: transform(prepared, (data) => ({ files: data.files })),
      })
      updateProductsWorkflow.runAsStep({
        input: transform(
          { prepared, uploaded },
          ({ prepared: data, uploaded: files }) => {
            const urls = new Map(
              data.files.map((file, index) => [
                file.filename,
                files[index].url,
              ]),
            )
            return {
              products: data.products.map((product) => ({
                id: product.id,
                thumbnail: urls.get(product.filenames[0])!,
                images: product.filenames.map((filename) => ({
                  url: urls.get(filename)!,
                })),
                metadata: { ...product.metadata, image_aspect_ratio: "4 / 3" },
              })),
            }
          },
        ),
      })
    })
    return new WorkflowResponse(
      transform(prepared, (data) => ({
        updated: data.products.map((product) => product.handle),
      })),
    )
  },
)
