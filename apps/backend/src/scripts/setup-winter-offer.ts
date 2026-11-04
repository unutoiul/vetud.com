import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { POPUP_CAMPAIGN_PREFIX } from "../lib/newsletter"
import { readSaleSettings } from "../lib/storewide-sale"
import { createStorewideSaleWorkflow } from "../workflows/storewide-sale"

/** 20% off every product, shown in the announcement bar. Dates and percentage: Admin > Sales. */
export const WINTER_SALE = { title: "Winter offer", percent_off: 20 }

/**
 * The sign-up pop-up's offer: 10% off the order for subscribers, on top of the sale prices.
 * Name, description and dates: Admin > Promotions > Campaigns; the code is only sent by email.
 */
export const WINTER_SUBSCRIBER_OFFER = {
  code: "WINTER10",
  percent_off: 10,
  campaign: {
    name: "Winter offer",
    campaign_identifier: `${POPUP_CAMPAIGN_PREFIX}winter-2026`,
    description: "An extra 10% off your order, on top of the 20% winter prices. One code per order; shipping not included.",
  },
}

/**
 * Starts the winter offer (owner's request, 2026-11-04): the 20% sale on every product and the
 * 10% code for newsletter subscribers. Both start now and run until they're ended in Admin.
 * Safe to run again: anything that already exists is left as it is.
 */
export default async function setupWinterOffer({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: lists } = await query.graph({ entity: "price_list", fields: ["id", "title", "metadata"], filters: { type: "sale" } })
  if (lists.some((list) => list.title === WINTER_SALE.title && readSaleSettings(list.metadata))) {
    logger.info(`Winter offer: the "${WINTER_SALE.title}" sale already exists.`)
  } else {
    const { result } = await createStorewideSaleWorkflow(container).run({
      input: { title: WINTER_SALE.title, percent_off: WINTER_SALE.percent_off, starts_at: null, ends_at: null, status: "active" },
    })
    logger.info(`Winter offer: ${WINTER_SALE.percent_off}% sale started with ${result.prices} prices.`)
  }

  const { data: promotions } = await query.graph({ entity: "promotion", fields: ["id"], filters: { code: WINTER_SUBSCRIBER_OFFER.code } })
  if (promotions.length) {
    logger.info(`Winter offer: the ${WINTER_SUBSCRIBER_OFFER.code} code already exists.`)
    return
  }
  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [{
        code: WINTER_SUBSCRIBER_OFFER.code,
        type: "standard",
        status: "active",
        is_automatic: false,
        application_method: { type: "percentage", target_type: "order", allocation: "across", value: WINTER_SUBSCRIBER_OFFER.percent_off },
        campaign: { ...WINTER_SUBSCRIBER_OFFER.campaign, starts_at: new Date(), ends_at: null },
      }],
    },
  })
  logger.info(`Winter offer: ${WINTER_SUBSCRIBER_OFFER.code} (${WINTER_SUBSCRIBER_OFFER.percent_off}% for subscribers) created.`)
}
