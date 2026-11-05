import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Every country a delivery zone covers (lower-case ISO codes, sorted): where checkout can ship. */
export async function listDeliveryCountries(container: MedusaContainer): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: zones } = await query.graph({ entity: "service_zone", fields: ["geo_zones.type", "geo_zones.country_code"] })
  const codes = zones.flatMap((zone) => (zone.geo_zones ?? []).flatMap((geo) => (geo?.country_code ? [geo.country_code.toLowerCase()] : [])))
  return [...new Set(codes)].sort()
}
