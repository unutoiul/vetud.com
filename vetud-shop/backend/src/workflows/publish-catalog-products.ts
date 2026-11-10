import { ProductStatus } from "@medusajs/framework/utils"
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

// Snapshot of the 14 existing products the owner requested published on 2026-10-26.
// Keep this list fixed: future drafts must not be published by this migration.
export const CATALOG_PUBLICATION_HANDLES = [
  "bacteriostatic-water",
  "peptide-series-01",
  "peptide-series-02",
  "peptide-series-03",
  "peptide-series-04",
  "peptide-series-05",
  "peptide-series-06",
  "research-blend-a",
  "research-blend-b",
  "retatrutide",
  "selank",
  "semaglutide",
  "semax",
  "tirzepatide",
]

/** Publishes the existing catalog without changing any commercial or product data. */
export const publishCatalogProductsWorkflow = createWorkflow(
  "publish-catalog-products",
  () => {
    const products = updateProductsWorkflow.runAsStep({
      input: {
        selector: { handle: CATALOG_PUBLICATION_HANDLES },
        update: { status: ProductStatus.PUBLISHED },
      },
    })
    return new WorkflowResponse(products)
  }
)
