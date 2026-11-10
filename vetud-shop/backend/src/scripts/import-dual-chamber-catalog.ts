import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { DUAL_CHAMBER_PRODUCTS, DUAL_CHAMBER_REVISION, EXPLAINER_IMAGE, imageUrl, RETIRED_HANDLES } from "../seed/dual-chamber-catalog"
import { importDualChamberCatalogWorkflow } from "../workflows/import-dual-chamber-catalog"

type VerifiedProduct = {
  handle: string
  status: string
  metadata?: Record<string, unknown> | null
  variants?: { title: string; manage_inventory: boolean; price_set?: { prices?: { currency_code: string; amount: number }[] } }[]
}

/**
 * Run with `npx medusa exec ./src/scripts/import-dual-chamber-catalog.ts`. The storefront should
 * already serve the artwork (set DUAL_CHAMBER_IMAGE_ORIGIN to test against a local storefront).
 * The deploy migration passes `requireImages: false`: the storefront shows these products from its
 * own copy of the photos, and its build needs this backend live first, so missing images only warn.
 */
export default async function importDualChamberCatalog({ container }: ExecArgs, { requireImages = true } = {}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const urls = [EXPLAINER_IMAGE(), ...DUAL_CHAMBER_PRODUCTS.flatMap((product) => [imageUrl(product.handle, "pen"), imageUrl(product.handle, "vial")])]
  const missing = (await Promise.all(urls.map(async (url) => {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) }).catch(() => null)
    return response?.ok && response.headers.get("content-type")?.includes("image/") ? null : url
  }))).filter((url): url is string => url !== null)
  if (missing.length && requireImages) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Publish the storefront artwork first: ${missing[0]}`)
  if (missing.length) logger.warn(`Dual-chamber artwork not live yet (${missing.length} images, e.g. ${missing[0]}); deploy the storefront.`)

  const { result } = await importDualChamberCatalogWorkflow(container).run({ input: {} })

  const { data } = await query.graph({
    entity: "product",
    fields: ["handle", "status", "metadata", "variants.title", "variants.manage_inventory", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount"],
    filters: { handle: [...DUAL_CHAMBER_PRODUCTS.map((product) => product.handle), ...RETIRED_HANDLES] },
  })
  const products = data as unknown as VerifiedProduct[]
  for (const expected of DUAL_CHAMBER_PRODUCTS) {
    const product = products.find((row) => row.handle === expected.handle)
    const variants = product?.variants ?? []
    if (!product || product.status !== "published" || product.metadata?.catalog_revision !== DUAL_CHAMBER_REVISION) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Not imported: ${expected.handle}`)
    if (variants.length !== expected.pen.length + expected.vial.length || variants.some((variant) => variant.manage_inventory)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unexpected variants: ${expected.handle}`)
    for (const currency of result.currencies) {
      if (variants.some((variant) => !variant.price_set?.prices?.some((price) => price.currency_code === currency && Number(price.amount) > 0))) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Missing ${currency.toUpperCase()} price: ${expected.handle}`)
    }
  }
  for (const handle of RETIRED_HANDLES) {
    const product = products.find((row) => row.handle === handle)
    if (product && product.status !== "draft") throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `${handle} should be a draft.`)
  }
  logger.info(`DUAL_CHAMBER_CATALOG_VERIFIED ${JSON.stringify(result)}`)
}
