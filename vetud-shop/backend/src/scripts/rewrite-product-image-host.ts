import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

type ProductRow = { id: string; handle: string; thumbnail?: string | null; images?: { url: string }[] | null }

/**
 * Points product images at the shop's new domain. Reports what would change unless IMAGE_HOST_APPLY=true:
 *
 *   IMAGE_HOST_TO=https://new-shop.example npx medusa exec ./src/scripts/rewrite-product-image-host.ts
 *
 * IMAGE_HOST_FROM defaults to https://www.vetud.com.
 */
export default async function rewriteProductImageHost({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const from = (process.env.IMAGE_HOST_FROM || "https://www.vetud.com").replace(/\/$/, "")
  const to = (process.env.IMAGE_HOST_TO || "").replace(/\/$/, "")
  if (!/^https?:\/\/[^/]+$/.test(to)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set IMAGE_HOST_TO to the new origin, e.g. https://shop.example.com")
  }
  const swap = (url: string) => (url === from || url.startsWith(`${from}/`) ? `${to}${url.slice(from.length)}` : url)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: ["id", "handle", "thumbnail", "images.url"] })
  const products = data as unknown as ProductRow[]

  const updates = products.flatMap((product) => {
    const images = (product.images ?? []).map(({ url }) => url)
    const thumbnail = product.thumbnail ? swap(product.thumbnail) : product.thumbnail
    const swapped = images.map(swap)
    if (thumbnail === product.thumbnail && swapped.every((url, index) => url === images[index])) return []
    return [{ id: product.id, thumbnail, images: swapped.map((url) => ({ url })) }]
  })

  logger.info(`Product images: ${updates.length} of ${products.length} products point at ${from}.`)
  if (process.env.IMAGE_HOST_APPLY !== "true") {
    logger.info(`Dry run. Set IMAGE_HOST_APPLY=true to change them to ${to}.`)
    return
  }
  if (updates.length) await updateProductsWorkflow(container).run({ input: { products: updates } })
  logger.info(`Done. ${updates.length} products now use ${to}.`)
}
