import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { RESEARCH_PEN_KITS } from "../seed/research-pen-kits"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { PRODUCTS } from "../seed/catalog"

const PLACEHOLDER_HANDLES = [
  "peptide-series-01",
  ...PRODUCTS.filter((product) => product.handle !== "retatrutide").map(
    (product) => product.handle
  ),
]

const prepareResearchPresentationStep = createStep(
  "prepare-research-presentation",
  async (_input: Record<string, never>, { container }) => {
    const catalog = [...RESEARCH_PEN_KITS, ...NASAL_SPRAYS]
    const { data } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "product",
        fields: ["id", "handle", "metadata", "images.id", "images.url"],
        filters: {
          handle: [
            ...catalog.map((product) => product.handle),
            ...PLACEHOLDER_HANDLES,
          ],
        },
      })
    const products = catalog.map((product) => {
      const current = data.find((item) => item.handle === product.handle)
      if (!current)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Missing product: ${product.handle}`
        )
      // Keep the original uploaded photos, prices and inventory. Verify both expected photos exist.
      const images = product.images.map((filename) => {
        const image = current.images?.find((image) =>
          image.url.endsWith(filename)
        )
        if (!image)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Missing ${product.handle} photo: ${filename}`
          )
        return { id: image.id, url: image.url }
      })
      const isPen = RESEARCH_PEN_KITS.some(
        (kit) => kit.handle === product.handle
      )
      const description = isPen
        ? `VETUD ${product.title} research pen kit, available in 10 mg, 20 mg and 40 mg amounts. ` +
          "Includes one pen in the selected amount, 12 disposable needles and an instruction booklet. " +
          "99% purity. Tested in UK lab. For laboratory research only. " +
          "Photos show the 40 mg kit; choose your amount above."
        : product.description
      return {
        id: current.id,
        status: ProductStatus.PUBLISHED,
        title: product.title,
        description,
        thumbnail: images[0].url,
        images,
        metadata: {
          ...current.metadata,
          purity: "99%",
          testing: "Tested in UK lab",
          image_aspect_ratio: "4 / 3",
        },
      }
    })
    const placeholders = data
      .filter((product) => PLACEHOLDER_HANDLES.includes(product.handle))
      .map((product) => ({ id: product.id, status: ProductStatus.DRAFT }))
    return new StepResponse({ products: [...products, ...placeholders] })
  }
)

/** Applies the requested names and quality wording, preserving both product images and all commercial data. */
export const refreshResearchProductPresentationWorkflow = createWorkflow(
  "refresh-research-product-presentation",
  (input: Record<string, never>) => {
    const prepared = prepareResearchPresentationStep(input)
    const products = updateProductsWorkflow.runAsStep({ input: prepared })
    return new WorkflowResponse(products)
  }
)
