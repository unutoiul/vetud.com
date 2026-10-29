import { createHash } from "node:crypto"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { SUPPLIED_PUBLICATIONS } from "../seed/supplied-research-publication"
import { planSuppliedPublication, publishSuppliedResearchProductsWorkflow } from "../workflows/publish-supplied-research-products"

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value)) ?? "null").digest("hex")

/**
 * Publishes NAD+, Melanotan and Ipamorelin as approved on 2026-10-30.
 * `DRY_RUN=1 npx medusa exec ./src/scripts/publish-supplied-research-products.ts` only prints the plan.
 * Afterwards it checks that no other product and no existing stock level changed.
 */
export default async function publishSuppliedProducts({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const handles: string[] = SUPPLIED_PUBLICATIONS.map((publication) => publication.handle)

  const plan = await planSuppliedPublication(container)
  if (process.env.DRY_RUN === "1") {
    logger.info(`SUPPLIED_PUBLICATION_PLAN ${JSON.stringify({ currencies: plan.currencies, products: plan.summary })}`)
    return
  }

  const productFields = ["id", "handle", "title", "subtitle", "description", "status", "thumbnail", "metadata", "images.url", "variants.id", "variants.price_set.prices.*"]
  const stockFields = ["id", "inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"]
  const { data: before } = await query.graph({ entity: "product", fields: productFields, pagination: { take: 1000 } })
  const { data: stockBefore } = await query.graph({ entity: "inventory_level", fields: stockFields, pagination: { take: 5000 } })

  const { result } = await publishSuppliedResearchProductsWorkflow(container).run({ input: {} })

  const { data: after } = await query.graph({ entity: "product", fields: productFields, pagination: { take: 1000 } })
  for (const previous of before.filter((product) => !handles.includes(product.handle))) {
    if (fingerprint(previous) !== fingerprint(after.find((product) => product.id === previous.id))) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Another product changed: ${previous.handle}`)
    }
  }
  const { data: stockAfter } = await query.graph({ entity: "inventory_level", fields: stockFields, pagination: { take: 5000 } })
  for (const previous of stockBefore) {
    if (fingerprint(previous) !== fingerprint(stockAfter.find((level) => level.id === previous.id))) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "An existing stock level changed.")
    }
  }

  const { data: published } = await query.graph({
    entity: "product",
    fields: ["handle", "status", "metadata", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount", "variants.inventory_items.inventory.location_levels.stocked_quantity"],
    filters: { handle: handles },
  })
  const report = published.map((product) => {
    const variant = product.variants?.[0] as unknown as {
      price_set?: { prices?: { currency_code: string; amount: number }[] }
      inventory_items?: { inventory?: { location_levels?: { stocked_quantity: number }[] } }[]
    }
    const prices = variant?.price_set?.prices ?? []
    const levels = variant?.inventory_items?.[0]?.inventory?.location_levels ?? []
    if (product.status !== "published" || product.metadata?.purity !== "99%" || !plan.currencies.every((currency) => prices.some((price) => price.currency_code === currency)) || !levels.length) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `${product.handle} is not fully published.`)
    }
    return {
      handle: product.handle,
      status: product.status,
      prices: Object.fromEntries(prices.map((price) => [price.currency_code, Number(price.amount)])),
      stock: levels.map((level) => Number(level.stocked_quantity)),
    }
  })
  logger.info(`SUPPLIED_PRODUCTS_PUBLISHED ${JSON.stringify({ added: result, products: report, otherProductsUnchanged: true, existingStockUnchanged: true })}`)
}
