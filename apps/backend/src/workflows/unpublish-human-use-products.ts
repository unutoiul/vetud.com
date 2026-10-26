import { ProductStatus } from "@medusajs/framework/utils"
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { RESEARCH_PEN_KITS } from "../seed/research-pen-kits"

/** The injection pen kits and nasal sprays: human-use formats that cannot be sold as research-only materials. */
export const HUMAN_USE_FORMAT_HANDLES = [...RESEARCH_PEN_KITS, ...NASAL_SPRAYS].map((product) => product.handle)

/**
 * Takes those products off the storefront by setting them to draft. Nothing is deleted: prices,
 * inventory, images and orders are untouched, and a product can be published again in Admin.
 */
export const unpublishHumanUseProductsWorkflow = createWorkflow(
  "unpublish-human-use-products",
  () => {
    const products = updateProductsWorkflow.runAsStep({
      input: {
        selector: { handle: HUMAN_USE_FORMAT_HANDLES },
        update: { status: ProductStatus.DRAFT },
      },
    })
    return new WorkflowResponse(products)
  }
)
