import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  AMOUNT_OPTION,
  CATEGORIES,
  FEATURED_COLLECTION,
  PRODUCTS,
  REGIONS,
  SHIPPING,
} from "./catalog"

const STORE_NAME = "Vetud Peptides"
const SALES_CHANNEL_NAME = "Vetud Storefront"
const GUARD_HANDLE = PRODUCTS[0].handle

/**
 * Creates the Vetud store: currencies, regions, taxes, warehouse, shipping options,
 * categories, the featured collection, placeholder products and their inventory.
 *
 * Safe to run more than once: it stops if the catalog already exists.
 */
export async function seedVetudStore(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: GUARD_HANDLE },
  })
  if (existingProducts.length) {
    logger.info("Vetud catalog already exists, skipping seed.")
    return
  }

  logger.info("Seeding Vetud sales channel and publishable key...")
  const { data: existingChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  let salesChannel: { id: string } | undefined = existingChannels[0]
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: SALES_CHANNEL_NAME, description: "Vetud Peptides website" }],
      },
    })
    salesChannel = result[0]
  }

  const {
    result: [publishableKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [{ title: "Vetud Storefront", type: "publishable", created_by: "" }],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  logger.info("Seeding store settings...")
  const supportedCurrencies = REGIONS.map((region, index) => ({
    currency_code: region.currency_code,
    is_default: index === 0,
  }))
  const { data: stores } = await query.graph({ entity: "store", fields: ["id"] })
  if (stores.length) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: stores[0].id },
        update: {
          name: STORE_NAME,
          supported_currencies: supportedCurrencies,
          default_sales_channel_id: salesChannel.id,
        },
      },
    })
  } else {
    await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: STORE_NAME,
            supported_currencies: supportedCurrencies,
            default_sales_channel_id: salesChannel.id,
          },
        ],
      },
    })
  }

  logger.info("Seeding regions and tax regions...")
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: REGIONS.map((region) => ({
        name: region.name,
        currency_code: region.currency_code,
        countries: [...region.countries],
        payment_providers: ["pp_system_default"],
      })),
    },
  })
  const allCountries = REGIONS.flatMap((region) => [...region.countries])
  // Tax regions start without a default rate (0%). Set real rates in Admin > Settings > Tax Regions.
  await createTaxRegionsWorkflow(container).run({
    input: allCountries.map((country_code) => ({ country_code, provider_id: "tp_system" })),
  })

  logger.info("Seeding warehouse and shipping...")
  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Main warehouse",
          address: { address_1: "", city: "", country_code: "US" },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  let shippingProfileId = shippingProfiles[0]?.id as string | undefined
  if (!shippingProfileId) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    })
    shippingProfileId = result[0].id
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Main warehouse delivery",
    type: "shipping",
    service_zones: REGIONS.map((region) => ({
      name: region.name,
      geo_zones: region.countries.map((country_code) => ({
        country_code,
        type: "country" as const,
      })),
    })),
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: REGIONS.flatMap((region) => {
      const zone = fulfillmentSet.service_zones.find((z) => z.name === region.name)!
      const currency = region.currency_code
      return [
        {
          name: "Standard Shipping",
          price_type: "flat" as const,
          provider_id: "manual_manual",
          service_zone_id: zone.id,
          shipping_profile_id: shippingProfileId!,
          type: {
            label: "Standard",
            description: `3–5 business days. Free over ${SHIPPING.freeShippingThreshold[currency]} ${currency.toUpperCase()}.`,
            code: "standard",
          },
          prices: [
            { currency_code: currency, amount: SHIPPING.standard[currency], rules: [] },
            {
              currency_code: currency,
              amount: 0,
              rules: [
                {
                  attribute: "item_total",
                  operator: "gte" as const,
                  value: SHIPPING.freeShippingThreshold[currency],
                },
              ],
            },
          ],
          rules: storeRules,
        },
        {
          name: "Express Shipping",
          price_type: "flat" as const,
          provider_id: "manual_manual",
          service_zone_id: zone.id,
          shipping_profile_id: shippingProfileId!,
          type: {
            label: "Express",
            description: "1–2 business days, tracked.",
            code: "express",
          },
          prices: [{ currency_code: currency, amount: SHIPPING.express[currency] }],
          rules: storeRules,
        },
      ]
    }),
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  })

  logger.info("Seeding categories, collection and options...")
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: CATEGORIES.map((category) => ({
        name: category.name,
        handle: category.handle,
        description: category.description,
        is_active: true,
      })),
    },
  })

  const {
    result: [featuredCollection],
  } = await createCollectionsWorkflow(container).run({
    input: { collections: [FEATURED_COLLECTION] },
  })

  const {
    result: [amountOption],
  } = await createProductOptionsWorkflow(container).run({
    input: { product_options: [AMOUNT_OPTION] },
  })
  const optionValueIds = new Map(
    (amountOption.values ?? []).map((value) => [value.value, value.id])
  )

  logger.info("Seeding products...")
  await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((product) => ({
        title: product.title,
        subtitle: product.subtitle,
        handle: product.handle,
        description: product.description,
        status: ProductStatus.PUBLISHED,
        weight: product.weight,
        category_ids: [categories.find((c) => c.handle === product.category)!.id],
        collection_id: product.featured ? featuredCollection.id : undefined,
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannel.id }],
        metadata: product.metadata,
        options: [
          {
            id: amountOption.id,
            value_ids: product.variants.map((variant) => optionValueIds.get(variant.amount)!),
          },
        ],
        variants: product.variants.map((variant) => ({
          title: variant.amount,
          sku: `${product.metadata.code}-${variant.amount.replace(/\s+/g, "").toUpperCase()}`,
          manage_inventory: true,
          options: { [AMOUNT_OPTION.title]: variant.amount },
          prices: [
            { currency_code: "usd", amount: variant.usd },
            { currency_code: "eur", amount: variant.eur },
          ],
        })),
      })),
    },
  })

  logger.info("Seeding inventory levels...")
  const stockBySku = new Map(
    PRODUCTS.flatMap((product) =>
      product.variants.map((variant) => [
        `${product.metadata.code}-${variant.amount.replace(/\s+/g, "").toUpperCase()}`,
        variant.stock,
      ])
    )
  )
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        inventory_item_id: item.id,
        stocked_quantity: stockBySku.get(item.sku ?? "") ?? 0,
      })),
    },
  })

  logger.info(
    `Vetud store seeded. Storefront publishable key: ${publishableKey.token} ` +
      `(regions: ${regions.map((region) => region.name).join(", ")})`
  )
}
