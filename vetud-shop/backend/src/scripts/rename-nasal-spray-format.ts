import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { DUAL_CHAMBER_PRODUCTS, NASAL_SPRAY, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"
import { renameNasalSprayFormatWorkflow } from "../workflows/rename-nasal-spray-format"

type VerifiedProduct = {
  handle: string
  metadata?: Record<string, unknown> | null
  options?: { title: string; values?: { value: string }[] }[]
  variants?: { title: string }[]
}

/** Run with `npx medusa exec ./src/scripts/rename-nasal-spray-format.ts`; safe to repeat. */
export default async function renameNasalSprayFormat({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { result } = await renameNasalSprayFormatWorkflow(container).run({ input: {} })
  const { data } = await query.graph({ entity: "product", fields: ["handle", "metadata", "options.title", "options.values.value", "variants.title"], filters: { handle: [...NASAL_SPRAY.handles] } })
  for (const handle of NASAL_SPRAY.handles) {
    const product = (data as unknown as VerifiedProduct[]).find((row) => row.handle === handle)
    const expected = DUAL_CHAMBER_PRODUCTS.find((item) => item.handle === handle)
    // Not imported in this database: nothing to rename.
    if (!product || !expected) continue
    const values = product.options?.find((option) => option.title === "Format")?.values?.map((value) => value.value) ?? []
    const titles = product.variants?.map((variant) => variant.title) ?? []
    const renamed = values.includes(NASAL_SPRAY.title) && !values.includes(PEN_KIT_BOX.title)
      && expected.pen.every((offer) => titles.includes(`${NASAL_SPRAY.title} · ${offer.amount}`))
      && !titles.some((title) => title.startsWith(`${PEN_KIT_BOX.title} · `))
      && product.metadata?.contents_box === NASAL_SPRAY.contents
    if (!renamed) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `The nasal spray format is incomplete: ${handle}`)
  }
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`NASAL_SPRAY_FORMAT_VERIFIED ${JSON.stringify(result)}`)
}
