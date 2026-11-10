import { ProductStatus } from "@medusajs/framework/utils"
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { NASAL_SPRAYS } from "../seed/research-nasal-sprays"
import { RESEARCH_PEN_KITS } from "../seed/research-pen-kits"

const RESEARCH_PRODUCT_HANDLES = [...RESEARCH_PEN_KITS, ...NASAL_SPRAYS].map((product) => product.handle)

/** Publishes the five supplied products without changing prices, inventory or product information. */
export const publishResearchProductsWorkflow = createWorkflow(
  "publish-research-products",
  () => {
    const products = updateProductsWorkflow.runAsStep({
      input: {
        selector: { handle: RESEARCH_PRODUCT_HANDLES },
        update: { status: ProductStatus.PUBLISHED },
      },
    })
    return new WorkflowResponse(products)
  }
)
