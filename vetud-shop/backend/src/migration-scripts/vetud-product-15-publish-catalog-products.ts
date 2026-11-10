import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publishCatalogProductsWorkflow } from "../workflows/publish-catalog-products"

/** Supersedes migration 14 and publishes all 14 existing products at the owner's request. */
export default async function vetudPublishCatalogProducts({
  container,
}: {
  container: MedusaContainer
}) {
  const { result } = await publishCatalogProductsWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `Catalog products published: ${JSON.stringify(result.map((product) => ({ handle: product.handle, status: product.status })))}`
    )
}
