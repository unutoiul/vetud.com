import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { PRODUCT_MERCHANDISING, withMerchandisingDefaults } from "../lib/product-merchandising"

/** Run again safely: existing Admin badge choices and all other metadata are preserved. */
export default async function setupProductMerchandising({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { handle: Object.keys(PRODUCT_MERCHANDISING) },
  })
  const updates = products.flatMap(product => {
    const previous = product.metadata ?? {}
    const metadata = withMerchandisingDefaults(product.handle, previous)
    if (previous.very_popular === metadata.very_popular && previous.best_seller === metadata.best_seller) return []
    return [{ id: product.id, metadata }]
  })
  if (updates.length) await updateProductsWorkflow(container).run({ input: { products: updates } })
  logger.info(`Product badges: ${updates.length} updated; ${products.length} selected products found.`)
}
