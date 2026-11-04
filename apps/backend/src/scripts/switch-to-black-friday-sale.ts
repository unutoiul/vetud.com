import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { POPUP_CAMPAIGN_PREFIX } from "../lib/newsletter"
import { readSaleSettings, saleState } from "../lib/storewide-sale"
import { createStorewideSaleWorkflow, updateStorewideSaleWorkflow } from "../workflows/storewide-sale"

/**
 * Black Friday replaces the winter offer (owner's request, 2026-11-05): 30% off every product for
 * everyone, shown in the announcement bar, until the end of 1 December. Percentage and dates:
 * Admin > Sales.
 */
export const BLACK_FRIDAY_SALE = { title: "Black Friday", percent_off: 30, ends_at: "2026-12-01T23:59:00.000Z" }

type SaleRow = { id: string; title: string; status?: string | null; starts_at?: string | null; ends_at?: string | null; metadata?: Record<string, unknown> | null }

/**
 * 1. The running store-wide sale (the 20% "Winter offer") becomes the 30% Black Friday sale; its
 *    prices are recalculated. Without a running sale, the Black Friday sale is created.
 * 2. Every pop-up sign-up code (WINTER10, BLACKFRIDAY15…) is switched off, so no code stacks on
 *    the sale and the pop-up stays hidden.
 * Safe to run again: once the Black Friday sale is at 30%, nothing changes.
 */
export default async function switchToBlackFridaySale({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const sale = BLACK_FRIDAY_SALE

  const { data } = await query.graph({ entity: "price_list", fields: ["id", "title", "status", "starts_at", "ends_at", "metadata"], filters: { type: "sale" } })
  const sales = (data as unknown as SaleRow[]).filter((list) => readSaleSettings(list.metadata))
  const current = sales.find((list) => list.title === sale.title) ?? sales.find((list) => ["live", "scheduled"].includes(saleState(list)))
  if (current && current.title === sale.title && readSaleSettings(current.metadata)?.percent_off === sale.percent_off) {
    logger.info(`Black Friday: the ${sale.percent_off}% sale is already set up.`)
  } else if (current) {
    const { result } = await updateStorewideSaleWorkflow(container).run({
      input: { id: current.id, title: sale.title, percent_off: sale.percent_off, starts_at: null, ends_at: sale.ends_at, status: "active" },
    })
    logger.info(`Black Friday: "${current.title}" is now the ${sale.percent_off}% Black Friday sale (${result.updated} prices updated, ${result.created} added).`)
  } else {
    const { result } = await createStorewideSaleWorkflow(container).run({
      input: { title: sale.title, percent_off: sale.percent_off, starts_at: null, ends_at: sale.ends_at, status: "active" },
    })
    logger.info(`Black Friday: ${sale.percent_off}% sale started with ${result.prices} prices.`)
  }

  const { data: promotions } = await query.graph({ entity: "promotion", fields: ["id", "code", "campaign.campaign_identifier"], filters: { status: "active" } })
  const popupCodes = (promotions as unknown as { id: string; code?: string | null; campaign?: { campaign_identifier?: string | null } | null }[])
    .filter((promotion) => promotion.campaign?.campaign_identifier?.startsWith(POPUP_CAMPAIGN_PREFIX))
  if (popupCodes.length) {
    await updatePromotionsWorkflow(container).run({ input: { promotionsData: popupCodes.map((promotion) => ({ id: promotion.id, status: "inactive" as const })) } })
    logger.info(`Black Friday: sign-up codes switched off: ${popupCodes.map((promotion) => promotion.code).join(", ")}.`)
  }
}
