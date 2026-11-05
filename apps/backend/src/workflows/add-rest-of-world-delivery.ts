import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createServiceZonesWorkflow, createShippingOptionsWorkflow, updateServiceZonesWorkflow } from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY } from "../lib/currencies"
import { syncCurrencyPrices } from "./sync-currency-prices"

/** The zone for every country outside Europe, the US, Canada and Australia (owner's request, 2026-11-06). */
export const REST_OF_WORLD = "Rest of the world"

/** Uninhabited territories in Medusa's country list: Antarctica, Bouvet, Heard and McDonald, US Minor Outlying Islands. */
const UNINHABITED = ["aq", "bv", "hm", "um"]

/** Same prices as everywhere else; longer delivery times, which also drive the arrival date at checkout. */
const WORLD_OPTIONS = [
  { code: "standard", name: "Standard Shipping", label: "Standard", description: "7–14 business days, tracked." },
  { code: "express", name: "Express Shipping", label: "Express", description: "3–6 business days, tracked." },
]

type GeoZone = { id: string; type: string; country_code: string }
type Zone = { id: string; name: string; fulfillment_set_id?: string; geo_zones?: GeoZone[] }
type Option = {
  id: string; name: string; provider_id: string; shipping_profile_id: string; service_zone_id: string
  type?: { code: string }; rules?: { attribute: string; operator: string; value: unknown }[]
  prices?: { currency_code: string; amount: number; price_rules?: unknown[] }[]
}

/**
 * Delivers to every other country: one more zone in the warehouse's fulfillment set with its own
 * Standard and Express options, copied from the existing ones (provider, profile, rules, USD price).
 * Countries added to Medusa later are added to the zone on the next run. Safe to repeat.
 */
const addRestOfWorldDeliveryStep = createStep("add-rest-of-world-delivery", async (_input: Record<string, never>, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const [{ data: countries }, { data: zoneRows }, { data: optionRows }] = await Promise.all([
    query.graph({ entity: "country", fields: ["iso_2"] }),
    query.graph({ entity: "service_zone", fields: ["id", "name", "fulfillment_set_id", "geo_zones.id", "geo_zones.type", "geo_zones.country_code"] }),
    query.graph({ entity: "shipping_option", fields: ["id", "name", "provider_id", "shipping_profile_id", "service_zone_id", "type.code", "rules.attribute", "rules.operator", "rules.value", "prices.currency_code", "prices.amount", "prices.price_rules.id"] }),
  ])
  const zones = zoneRows as unknown as Zone[]
  const options = optionRows as unknown as Option[]
  const world = zones.find((zone) => zone.name === REST_OF_WORLD)
  const home = zones.find((zone) => zone.id !== world?.id && zone.geo_zones?.some((geo) => geo.country_code === "us"))
  if (!home?.fulfillment_set_id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No delivery zone ships to the United States.")

  const covered = new Set(zones.filter((zone) => zone.id !== world?.id).flatMap((zone) => (zone.geo_zones ?? []).map((geo) => geo.country_code)))
  const rest = countries.map((country) => country.iso_2 as string).filter((code) => code && !covered.has(code) && !UNINHABITED.includes(code)).sort()

  let zoneId = world?.id
  if (!world) {
    const { result } = await createServiceZonesWorkflow(container).run({
      input: { data: [{ fulfillment_set_id: home.fulfillment_set_id, name: REST_OF_WORLD, geo_zones: rest.map((country_code) => ({ type: "country" as const, country_code })) }] },
    })
    zoneId = result[0].id
  } else {
    const present = new Set((world.geo_zones ?? []).map((geo) => geo.country_code))
    const added = rest.filter((code) => !present.has(code))
    if (added.length) {
      await updateServiceZonesWorkflow(container).run({
        input: { selector: { id: world.id }, update: { geo_zones: [...(world.geo_zones ?? []).map((geo) => ({ id: geo.id })), ...added.map((country_code) => ({ type: "country" as const, country_code }))] } },
      })
    }
  }

  const existing = options.filter((option) => option.service_zone_id === zoneId)
  const missing = WORLD_OPTIONS.filter((spec) => !existing.some((option) => option.type?.code === spec.code))
  if (missing.length) {
    await createShippingOptionsWorkflow(container).run({
      input: missing.map((spec) => {
        const model = options.find((option) => option.service_zone_id === home.id && option.type?.code === spec.code)
        const usd = model?.prices?.find((price) => price.currency_code === BASE_CURRENCY && !price.price_rules?.length)
        if (!model || !usd) throw new MedusaError(MedusaError.Types.NOT_FOUND, `No ${spec.label} option with a USD price to copy.`)
        return {
          name: spec.name,
          service_zone_id: zoneId!,
          shipping_profile_id: model.shipping_profile_id,
          provider_id: model.provider_id,
          price_type: "flat" as const,
          type: { code: spec.code, label: spec.label, description: spec.description },
          prices: [{ currency_code: BASE_CURRENCY, amount: Number(usd.amount) }],
          rules: (model.rules ?? []).map((rule) => ({ attribute: rule.attribute, operator: rule.operator as "eq", value: rule.value as string })),
        }
      }),
    })
  }

  // EUR and GBP prices for the new options, from USD.
  await syncCurrencyPrices(container)
  logger.info(`${REST_OF_WORLD}: ${rest.length} countries; ${missing.length ? `added ${missing.map((spec) => spec.label).join(" and ")}` : "options already there"}.`)
  return new StepResponse({ countries: rest.length, options: missing.length })
})

export const addRestOfWorldDeliveryWorkflow = createWorkflow(
  "add-rest-of-world-delivery",
  (input: Record<string, never>) => new WorkflowResponse(addRestOfWorldDeliveryStep(input)),
)
