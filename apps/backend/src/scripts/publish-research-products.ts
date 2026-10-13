import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publishResearchProductsWorkflow } from "../workflows/publish-research-products"

/** Run with `npx medusa exec ./src/scripts/publish-research-products.ts`. */
export default async function publishResearchProducts({ container }: ExecArgs) {
  const { result } = await publishResearchProductsWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `Research products published: ${JSON.stringify(result.map((product) => ({ handle: product.handle, status: product.status })))}`
    )
}
