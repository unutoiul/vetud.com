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
import { RESEARCH_PEN_KITS } from "../seed/research-pen-kits"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { findProductAsset } from "../seed/product-images"
import {
  PRODUCT_CARE_DESCRIPTION,
  PRODUCT_HANDLING_GUIDANCE,
  PRODUCT_QUALITY_REVISION,
  PRODUCT_STABILITY_GUIDANCE,
  PRODUCT_STORAGE_GUIDANCE,
  PRODUCT_TESTING_LABEL,
  PEN_FEATURES,
  PEN_FORM,
  PEN_STABILITY_GUIDANCE,
  penDescription,
  penIngredients,
} from "../seed/product-care"

const prepareProductQualityStep = createStep(
  "prepare-product-quality",
  async (_input: Record<string, never>, { container }) => {
    const handles = [...RESEARCH_PEN_KITS, ...NASAL_SPRAYS].map(
      (product) => product.handle,
    )
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "description",
          "metadata",
          "thumbnail",
          "images.id",
          "images.url",
        ],
        filters: { handle: handles },
      })
    const products = handles
      .map((handle) => {
        const current = data.find((product) => product.handle === handle)
        if (!current)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Missing product: ${handle}`,
          )
        const pen = RESEARCH_PEN_KITS.find(
          (product) => product.handle === handle,
        )
        const description = (current.description ?? "").replace(
          /Tested in UK lab\.?/gi,
          `${PRODUCT_TESTING_LABEL}.`,
        )
        return {
          id: current.id,
          handle,
          subtitle: pen?.subtitle,
          description: pen
            ? penDescription(pen.title)
            : description.includes(PRODUCT_CARE_DESCRIPTION)
              ? description
              : `${description}\n\n${PRODUCT_CARE_DESCRIPTION}`,
          filenames: pen?.images ?? [],
          metadata: {
            ...current.metadata,
            testing: PRODUCT_TESTING_LABEL,
            ...(pen
              ? {
                  form: PEN_FORM,
                  features: PEN_FEATURES,
                  ingredients: penIngredients(pen.title),
                }
              : {}),
            storage: PRODUCT_STORAGE_GUIDANCE,
            stability: pen
              ? PEN_STABILITY_GUIDANCE
              : PRODUCT_STABILITY_GUIDANCE,
            handling: PRODUCT_HANDLING_GUIDANCE,
            quality_copy_revision: PRODUCT_QUALITY_REVISION,
          },
          needsUpdate:
            current.metadata?.quality_copy_revision !==
            PRODUCT_QUALITY_REVISION,
          images: current.images,
        }
      })
      .filter((product) => product.needsUpdate)
    const files = products.flatMap((product) =>
      product.filenames
        .filter(
          (filename) =>
            !product.images?.some((image) => image.url.endsWith(filename)),
        )
        .map((filename) => {
          const asset = findProductAsset(filename)
          if (!asset)
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Missing purity label photo: ${filename}`,
            )
          return {
            filename,
            mimeType: "image/png",
            content: readFileSync(asset).toString("base64"),
            access: "public" as const,
          }
        }),
    )
    return new StepResponse({ products, files })
  },
)

/** Updates purity wording, care guidance and pen photo labels while retaining all prices and stock. */
export const refreshProductQualityWorkflow = createWorkflow(
  "refresh-product-quality",
  (input: Record<string, never>) => {
    const prepared = prepareProductQualityStep(input)
    const uploaded = when(
      "has-purity-label-photo-uploads",
      prepared,
      (data) => data.files.length > 0,
    ).then(() =>
      uploadFilesWorkflow.runAsStep({
        input: transform(prepared, (data) => ({ files: data.files })),
      }),
    )
    when(
      "has-product-quality-updates",
      prepared,
      (data) => data.products.length > 0,
    ).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform(
          { prepared, uploaded },
          ({ prepared: data, uploaded: files }) => {
            const urls = new Map(
              data.files.map((file, index) => [
                file.filename,
                files?.[index]?.url,
              ]),
            )
            return {
              products: data.products.map((product) => ({
                id: product.id,
                ...(product.subtitle ? { subtitle: product.subtitle } : {}),
                description: product.description,
                metadata: product.metadata,
                ...(product.filenames.length
                  ? {
                      images: product.filenames.map((filename) => {
                        const existing = product.images?.find((image) =>
                          image.url.endsWith(filename),
                        )
                        return existing
                          ? { id: existing.id, url: existing.url }
                          : { url: urls.get(filename)! }
                      }),
                      thumbnail:
                        product.images?.find((image) =>
                          image.url.endsWith(product.filenames[0]),
                        )?.url ?? urls.get(product.filenames[0])!,
                    }
                  : {}),
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
