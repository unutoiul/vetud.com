import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { DUAL_CHAMBER_PRODUCTS, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"
import { addPenKitBoxesWorkflow } from "../workflows/add-pen-kit-boxes"

type VerifiedProduct = { handle: string; variants?: { title: string; price_set?: { prices?: { currency_code: string; amount: number }[] } }[] }

/** Run with `npx medusa exec ./src/scripts/add-pen-kit-boxes.ts`; safe to repeat. */
export default async function addPenKitBoxes({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { result } = await addPenKitBoxesWorkflow(container).run({ input: {} })
  const catalog = DUAL_CHAMBER_PRODUCTS.filter((product) => !(PEN_KIT_BOX.excluded as readonly string[]).includes(product.handle))
  const { data } = await query.graph({ entity: "product", fields: ["handle", "variants.title", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount"], filters: { handle: catalog.map((product) => product.handle) } })
  for (const expected of catalog) {
    const product = (data as unknown as VerifiedProduct[]).find((row) => row.handle === expected.handle)
    for (const offer of expected.pen) {
      const box = product?.variants?.find((variant) => variant.title === `${PEN_KIT_BOX.title} · ${offer.amount}`)
      const usd = box?.price_set?.prices?.find((price) => price.currency_code === "usd")
      if (!box || Number(usd?.amount) !== offer.usd + PEN_KIT_BOX.premium) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Missing or mispriced Pen kit box: ${expected.handle} ${offer.amount}`)
    }
  }
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`PEN_KIT_BOXES_VERIFIED ${JSON.stringify(result)}`)
}
