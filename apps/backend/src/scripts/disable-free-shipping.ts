import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Turns off free shipping everywhere. Idempotent; prices without a cart-total rule are kept.
 *  1. Removes every shipping price that depends on the cart total ("free over X").
 *  2. Drops "Free over X." from the shipping option type descriptions.
 *  3. Removes `free_shipping_threshold` from every region, which hides the storefront's
 *     free-shipping banner, progress bar and product-page note.
 */
export default async function disableFreeShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const regionModule = container.resolve(Modules.REGION)

  const { data: links } = await query.graph({
    entity: "shipping_option_price_set",
    fields: ["price_set_id"],
  })
  const priceSetIds = links.map((link) => link.price_set_id as string)
  const priceSets = priceSetIds.length
    ? await pricing.listPriceSets({ id: priceSetIds }, { relations: ["prices", "prices.price_rules"] })
    : []
  const thresholdPrices = priceSets.flatMap((priceSet) =>
    (priceSet.prices ?? []).filter((price) =>
      ((price as { price_rules?: { attribute: string }[] }).price_rules ?? []).some((rule) => rule.attribute === "item_total")
    )
  )
  if (thresholdPrices.length) {
    await pricing.removePrices(thresholdPrices.map((price) => price.id))
  }
  logger.info(`Free shipping: removed ${thresholdPrices.length} cart-total shipping prices.`)

  const types = await fulfillment.listShippingOptionTypes({})
  for (const type of types) {
    const description = type.description?.replace(/\s*Free over [^.]*\./i, "").trim()
    if (description !== undefined && description !== type.description) {
      await fulfillment.updateShippingOptionTypes(type.id, { description })
      logger.info(`Free shipping: "${type.label}" is now described as "${description}"`)
    }
  }

  const regions = await regionModule.listRegions({}, { select: ["id", "name", "metadata"] })
  for (const region of regions) {
    if (region.metadata?.free_shipping_threshold === undefined) continue
    // An empty string deletes the metadata key.
    await regionModule.updateRegions(region.id, { metadata: { free_shipping_threshold: "" } })
    logger.info(`Free shipping: removed the threshold from ${region.name}.`)
  }
}
