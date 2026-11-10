import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { PRODUCT_MERCHANDISING, withExpandedMerchandising } from "../lib/product-merchandising"

/** Apply the expanded selection once, including badges previously stored as false. */
export default async function expandProductMerchandising({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const selection = {
    entity: "product",
    fields: ["id", "handle", "metadata"],
    filters: { handle: Object.keys(PRODUCT_MERCHANDISING) },
  }
  const { data: products } = await query.graph(selection)
  const updates = products.flatMap(product => {
    const previous = product.metadata ?? {}
    const metadata = withExpandedMerchandising(product.handle, previous)
    return metadata === previous ? [] : [{ id: product.id, metadata }]
  })
  if (updates.length) await updateProductsWorkflow(container).run({ input: { products: updates } })
  const { data: saved } = await query.graph(selection)
  for (const product of saved) {
    logger.info(`${product.handle}: very_popular=${product.metadata?.very_popular}, best_seller=${product.metadata?.best_seller}`)
  }
  logger.info(`Expanded product badges: ${updates.length} updated; ${saved.length} selected products found.`)
}
