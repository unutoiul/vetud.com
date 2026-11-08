import type { ExecArgs } from "@medusajs/framework/types"
import { reviewProductFormatsWorkflow } from "../workflows/review-product-formats"

/** Keep the catalog review in place on subsequent deployments and catalog imports. */
export default async function reviewedProductFormats({ container }: ExecArgs) {
  await reviewProductFormatsWorkflow(container).run({ input: {} })
}
