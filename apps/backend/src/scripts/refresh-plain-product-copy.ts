import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { DUAL_CHAMBER_PRODUCTS, PLAIN_COPY } from "../seed/dual-chamber-catalog"

type ProductRow = { id: string; handle: string; subtitle?: string | null; description?: string | null; metadata?: Record<string, unknown> | null }

/**
 * Applies the plain-language subtitle and description of the products in PLAIN_COPY to an existing
 * database. Prices, SKUs, stock and every other field stay as they are. Safe to run again.
 * Run with `npx medusa exec ./src/scripts/refresh-plain-product-copy.ts`.
 */
export default async function refreshPlainProductCopy({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: ["id", "handle", "subtitle", "description", "metadata"], filters: { handle: [...PLAIN_COPY.handles] } })
  const updates = (data as unknown as ProductRow[]).flatMap((row) => {
    const copy = DUAL_CHAMBER_PRODUCTS.find((product) => product.handle === row.handle)
    if (!copy || (row.subtitle === copy.summary && row.description === copy.description)) return []
    return [{ id: row.id, subtitle: copy.summary, description: copy.description, metadata: { ...(row.metadata ?? {}), plain_copy_revision: PLAIN_COPY.revision } }]
  })
  if (updates.length) await updateProductsWorkflow(container).run({ input: { products: updates } })
  logger.info(`Plain product copy: ${updates.length} of ${PLAIN_COPY.handles.length} products updated.`)
}
