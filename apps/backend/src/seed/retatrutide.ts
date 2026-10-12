import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { AMOUNT_OPTION, RETATRUTIDE } from "./catalog"
import { uploadProductImage } from "./product-images"

const OLD_HANDLE = "peptide-series-01"
const PLUGIN_PRICE_WORKFLOW = "update-prices-with-exchange-rates"

type OldProduct = {
  id: string
  categories?: { id: string }[]
  collection_id?: string | null
  sales_channels?: { id: string }[]
  shipping_profile?: { id: string } | null
}

/**
 * Replaces the placeholder "Peptide Series 01" with Retatrutide 40 mg (with its photo) in
 * databases seeded before it existed: the placeholder is set to draft and Retatrutide takes its
 * category and Featured spot. Fresh databases get Retatrutide straight from the seed.
 * Skips itself when Retatrutide already exists or there is no placeholder.
 */
export async function replaceSeriesOneWithRetatrutide(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: oldProducts } = await query.graph({
    entity: "product",
    fields: ["id", "categories.id", "collection_id", "sales_channels.id", "shipping_profile.id"],
    filters: { handle: OLD_HANDLE },
  })
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: RETATRUTIDE.handle },
  })
  const old = oldProducts[0] as OldProduct | undefined
  if (!old || existing.length) {
    logger.info("Retatrutide: nothing to replace, skipping.")
    return
  }

  // The shared "Amount" option needs a "40 mg" value. The full list is sent, so existing values
  // (used by other products' variants) are kept.
  const { data: options } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "values.id", "values.value"],
    filters: { title: AMOUNT_OPTION.title },
  })
  const option = options[0] as { id: string; values?: { id: string; value: string }[] } | undefined
  if (!option) {
    logger.warn(`Retatrutide: option "${AMOUNT_OPTION.title}" not found, skipping.`)
    return
  }
  const amounts = RETATRUTIDE.variants.map((variant) => variant.amount)
  const current = (option.values ?? []).map((value) => value.value)
  const missing = amounts.filter((amount) => !current.includes(amount))
  if (missing.length) {
    await updateProductOptionsWorkflow(container).run({
      input: { selector: { id: option.id }, update: { values: [...current, ...missing] } },
    })
  }
  const { data: refreshed } = await query.graph({
    entity: "product_option",
    fields: ["values.id", "values.value"],
    filters: { id: option.id },
  })
  const valueIds = new Map(
    ((refreshed[0] as { values?: { id: string; value: string }[] }).values ?? []).map((value) => [value.value, value.id])
  )

  const sku = (amount: string) => `${RETATRUTIDE.metadata.code}-${amount.replace(/\s+/g, "").toUpperCase()}`

  // Retire the placeholder instead of deleting it: open orders may still reserve its stock.
  // It disappears from the store and can be deleted in Admin once its orders are settled.
  await updateProductsWorkflow(container).run({
    input: { selector: { id: old.id }, update: { status: ProductStatus.DRAFT, collection_id: null } },
  })

  const imageUrl = RETATRUTIDE.image ? await uploadProductImage(container, RETATRUTIDE.image) : null

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: RETATRUTIDE.title,
          subtitle: RETATRUTIDE.subtitle,
          handle: RETATRUTIDE.handle,
          description: RETATRUTIDE.description,
          status: ProductStatus.PUBLISHED,
          weight: RETATRUTIDE.weight,
          category_ids: (old.categories ?? []).map((category) => category.id),
          collection_id: old.collection_id ?? undefined,
          shipping_profile_id: old.shipping_profile?.id,
          sales_channels: (old.sales_channels ?? []).map((channel) => ({ id: channel.id })),
          metadata: RETATRUTIDE.metadata,
          ...(imageUrl ? { thumbnail: imageUrl, images: [{ url: imageUrl }] } : {}),
          options: [{ id: option.id, value_ids: amounts.map((amount) => valueIds.get(amount)!) }],
          variants: RETATRUTIDE.variants.map((variant) => ({
            title: variant.amount,
            sku: sku(variant.amount),
            manage_inventory: true,
            options: { [AMOUNT_OPTION.title]: variant.amount },
            prices: [
              { currency_code: "usd", amount: variant.usd },
              { currency_code: "eur", amount: variant.eur },
            ],
          })),
        },
      ],
    },
  })

  // Stock at the main warehouse.
  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: { sku: RETATRUTIDE.variants.map((variant) => sku(variant.amount)) },
  })
  const stock = new Map(RETATRUTIDE.variants.map((variant) => [sku(variant.amount), variant.stock]))
  if (locations[0] && items.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: (items as { id: string; sku: string }[]).map((item) => ({
          location_id: (locations[0] as { id: string }).id,
          inventory_item_id: item.id,
          stocked_quantity: stock.get(item.sku) ?? 0,
        })),
      },
    })
  }

  // Prices in the other European currencies, via the currency plugin.
  try {
    await container.resolve(Modules.WORKFLOW_ENGINE).run(PLUGIN_PRICE_WORKFLOW, { input: {} })
  } catch (error) {
    logger.warn(`Retatrutide: price conversion failed (${(error as Error).message}).`)
  }

  logger.info(
    `Retatrutide: created${imageUrl ? " with its photo" : ""}; "${OLD_HANDLE}" set to draft.`
  )
}
