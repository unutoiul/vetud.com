import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

type Region = { id: string; name: string; currency_code: string; countries?: { iso_2?: string | null }[] }

const codes = (region: Region) => (region.countries ?? []).map((country) => country.iso_2 ?? "").filter(Boolean)

/**
 * Prices the United Kingdom in pounds. The "Simplify global currencies" change put every European
 * country, the UK included, into the single euro region, which left the GBP region with no
 * countries and showed non-euro countries in the euro list. A country belongs to exactly one
 * region, so this moves `gb` out of the euro region and into the GBP region. Prices and shipping
 * are unchanged; running it again does nothing.
 */
export async function restoreUkPoundRegion(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })
  const regions = data as Region[]
  const uk = regions.find((region) => region.currency_code === "gbp")
  if (!uk) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "There is no GBP region to move the United Kingdom into.")
  }
  const europe = regions.find((region) => region.currency_code === "eur" && codes(region).includes("gb"))
  if (!europe) {
    logger.info("The United Kingdom is not in the euro region; nothing to change.")
    return { moved: false }
  }

  // Take it out of the euro region first: a country cannot be in two regions.
  await updateRegionsWorkflow(container).run({
    input: { selector: { id: europe.id }, update: { countries: codes(europe).filter((code) => code !== "gb") } },
  })
  await updateRegionsWorkflow(container).run({
    input: { selector: { id: uk.id }, update: { countries: [...new Set([...codes(uk), "gb"])] } },
  })
  logger.info(`Moved gb from "${europe.name}" (EUR) to "${uk.name}" (GBP).`)
  return { moved: true }
}
