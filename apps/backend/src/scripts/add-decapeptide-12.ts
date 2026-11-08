import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { boxFormat, DUAL_CHAMBER_PRODUCTS, DUAL_CHAMBER_REVISION, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"
import { addPenKitBoxesWorkflow } from "../workflows/add-pen-kit-boxes"
import { importDualChamberCatalogWorkflow } from "../workflows/import-dual-chamber-catalog"
import { syncCurrencyPrices } from "../workflows/sync-currency-prices"
import syncStorewideSales from "../jobs/sync-storewide-sales"
import { catalogFormatAllowed, PRODUCT_FORMAT_REVIEW } from "../lib/product-format-review"

const HANDLE = "decapeptide-12"

type VerifiedProduct = {
  status: string
  metadata?: Record<string, unknown> | null
  variants?: { title: string; sku?: string | null; price_set?: { prices?: { currency_code: string; amount: number; price_list_id?: string | null }[] } }[]
}

/**
 * Adds Decapeptide-12 (owner request 2026-11-09): a 200 mg research vial ($250).
 * The format review excludes pen kits, dual-chamber cartridges and diluent add-ons. The other
 * products are already at this catalog revision, so they are left alone. Then converts the USD
 * prices into the other currencies and adds the product to the running sale straight away, rather
 * than waiting for the hourly and 15-minute jobs. Run with
 * `npx medusa exec ./src/scripts/add-decapeptide-12.ts`; safe to repeat. The deploy migration runs it
 * with `strict: false`, so a later Admin edit (a new price, say) only logs a warning instead of
 * stopping the deploy.
 */
export default async function addDecapeptide12({ container }: ExecArgs, { syncPrices = true, strict = true } = {}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const expected = DUAL_CHAMBER_PRODUCTS.find((product) => product.handle === HANDLE)!
  const fail = (message: string) => {
    if (strict) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    logger.warn(`Decapeptide-12: ${message}`)
  }

  // Only Decapeptide-12 may be created here; anything else pending would be a different change.
  const { data: rows } = await query.graph({ entity: "product", fields: ["handle", "metadata"], filters: { handle: DUAL_CHAMBER_PRODUCTS.map((product) => product.handle) } })
  const pending = DUAL_CHAMBER_PRODUCTS.filter((product) => product.handle !== HANDLE && (rows as { handle: string; metadata?: Record<string, unknown> | null }[]).find((row) => row.handle === product.handle)?.metadata?.catalog_revision !== DUAL_CHAMBER_REVISION)
  if (pending.length) return fail(`not at ${DUAL_CHAMBER_REVISION}: ${pending.map((product) => product.handle).join(", ")}. Nothing was changed.`)

  const { result: catalog } = await importDualChamberCatalogWorkflow(container).run({ input: {} })
  const { result: boxes } = await addPenKitBoxesWorkflow(container).run({ input: {} })
  if (syncPrices) {
    await syncCurrencyPrices(container)
    await syncStorewideSales(container)
  }

  const { data } = await query.graph({
    entity: "product",
    fields: ["status", "metadata", "variants.title", "variants.sku", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount", "variants.price_set.prices.price_list_id"],
    filters: { handle: HANDLE },
  })
  const product = (data as unknown as VerifiedProduct[])[0]
  if (!product || product.status !== "published" || product.metadata?.catalog_revision !== DUAL_CHAMBER_REVISION || product.metadata?.format_review_revision !== PRODUCT_FORMAT_REVIEW) {
    return fail(`${HANDLE} was not published in full.`)
  }
  const box = boxFormat(HANDLE).title
  const wanted = [
    ...(catalogFormatAllowed(HANDLE, "Dual-chamber vial") ? expected.pen.map((offer) => ({ title: `Dual-chamber vial · ${offer.amount}`, usd: offer.usd })) : []),
    ...expected.vial.map((offer) => ({ title: `Vial · ${offer.amount}`, usd: offer.usd })),
    ...(catalogFormatAllowed(HANDLE, box) ? expected.pen.map((offer) => ({ title: `${box} · ${offer.amount}`, usd: offer.usd + PEN_KIT_BOX.premium })) : []),
  ]
  const variants = product.variants ?? []
  if (variants.length !== wanted.length) fail(`${HANDLE} has ${variants.length} variants, expected ${wanted.length}.`)
  const prices = wanted.map(({ title, usd }) => {
    const variant = variants.find((item) => item.title === title)
    const regular = variant?.price_set?.prices?.filter((price) => !price.price_list_id) ?? []
    const amount = Number(regular.find((price) => price.currency_code === "usd")?.amount)
    if (amount !== usd) fail(`${title}: USD price ${amount}, expected ${usd}.`)
    return { title, sku: variant?.sku, currencies: regular.map((price) => price.currency_code).sort() }
  })
  logger.info(`DECAPEPTIDE_12_VERIFIED ${JSON.stringify({ catalog, boxes, prices })}`)
}
