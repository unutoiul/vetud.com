import { createHash } from "node:crypto"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { importSuppliedResearchProductsWorkflow } from "../workflows/import-supplied-research-products"
import { PRODUCT_IMAGE_ORIGIN, SUPPLIED_RESEARCH_PRODUCTS } from "../seed/supplied-research-products"

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value)) ?? "null").digest("hex")

/** Data-only CLI import: create drafts, verify records, and preserve the existing catalog. */
export default async function importSuppliedProducts({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fields = ["id", "handle", "title", "subtitle", "description", "status", "thumbnail", "metadata", "images.*", "categories.id", "variants.id", "variants.title", "variants.sku", "variants.manage_inventory", "variants.allow_backorder", "variants.price_set.prices.*"]
  const { data: before } = await query.graph({ entity: "product", fields, pagination: { take: 1000 } })
  const stockFields = ["id", "inventory_item_id", "location_id", "stocked_quantity"]
  const { data: stockBefore } = await query.graph({ entity: "inventory_level", fields: stockFields, pagination: { take: 1000 } })
  await Promise.all(SUPPLIED_RESEARCH_PRODUCTS.flatMap(product => ["closed", "open"].map(async view => {
    const url = `${PRODUCT_IMAGE_ORIGIN}/images/products/${product.handle}-${view}.webp`
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) })
    if (!response.ok || !response.headers.get("content-type")?.includes("image/")) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Publish the supplied photograph first: ${url}`)
  })))

  const { result } = await importSuppliedResearchProductsWorkflow(container).run({ input: {} })
  const { data: after } = await query.graph({ entity: "product", fields, pagination: { take: 1000 } })
  for (const previous of before) {
    if (fingerprint(previous) !== fingerprint(after.find(product => product.id === previous.id))) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `An existing product changed: ${previous.handle}`)
  }
  const { data: stockAfter } = await query.graph({ entity: "inventory_level", fields: stockFields, pagination: { take: 1000 } })
  for (const previous of stockBefore) {
    if (fingerprint(previous) !== fingerprint(stockAfter.find(level => level.id === previous.id))) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "An existing stock level changed during draft import.")
  }
  for (const level of stockAfter) {
    if (!stockBefore.some(previous => previous.id === level.id) && Number(level.stocked_quantity) !== 0) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Unexpected stock was assigned to a new inventory level.")
  }
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "status", "thumbnail", "metadata", "images.url", "categories.handle", "variants.id", "variants.title", "variants.sku", "variants.manage_inventory", "variants.allow_backorder", "variants.price_set.prices.amount", "variants.price_set.prices.currency_code"],
    filters: { handle: SUPPLIED_RESEARCH_PRODUCTS.map(product => product.handle) },
  })
  if (products.length !== 3) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Expected three imported products.")
  const details = products.map(product => {
    const expected = SUPPLIED_RESEARCH_PRODUCTS.find(item => item.handle === product.handle)!
    const categories = (product.categories ?? []).flatMap(category => category ? [category.handle] : [])
    const variants = product.variants ?? []
    const variant = variants[0]
    if (!variant || product.status !== "draft" || variants.length !== 1 || variant.sku !== expected.sku || variant.title !== expected.amount || !variant.manage_inventory || variant.allow_backorder) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unexpected draft or variant state: ${expected.handle}`)
    // The generated graph types omit the Pricing Module's linked fields.
    const prices = (variant as unknown as { price_set?: { prices?: { amount: number; currency_code: string }[] } }).price_set?.prices ?? []
    if (!expected.categoryHandles.every(handle => categories.includes(handle)) || product.images?.length !== 2) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unexpected category or gallery: ${expected.handle}`)
    for (const [currency, amount] of [["usd", expected.usd], ["eur", expected.eur]] as const) {
      if (!prices.some(price => price.currency_code === currency && Number(price.amount) === amount)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unexpected proposed price: ${expected.handle} ${currency}`)
    }
    if (product.metadata?.purity || product.metadata?.testing || product.metadata?.concentration || product.metadata?.ingredients) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unverified specifications were populated: ${expected.handle}`)
    if (product.handle === "melanotan" && product.metadata?.melanotan_subtype !== "unspecified") throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Melanotan subtype must remain unspecified.")
    return { id: product.id, handle: product.handle, title: product.title, status: product.status, categories, amount: variant.title, sku: variant.sku, prices: prices.map(price => ({ currency_code: price.currency_code, amount: Number(price.amount) })), images: product.images?.map(image => image?.url), inventory: "No available stock assigned" }
  })
  logger.info(`SUPPLIED_PRODUCTS_VERIFIED ${JSON.stringify({ result, products: details, totalProducts: after.length, existingProductsUnchanged: true, stockUnchanged: true, specificationsUnspecified: true })}`)
}
