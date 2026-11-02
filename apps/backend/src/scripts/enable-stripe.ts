import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const PROVIDER_ID = "pp_stripe_stripe"

/** Run from the source root with the actual storefront countries, preserving other methods. */
export default async function enableStripe({ container }: ExecArgs) {
  const countries = [...new Set((process.env.STRIPE_REGION_COUNTRIES || "").split(",").map(code => code.trim().toLowerCase()).filter(Boolean))]
  if (!countries.length || countries.some(code => !/^[a-z]{2}$/.test(code))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set STRIPE_REGION_COUNTRIES to the storefront's supported ISO country codes.")
  }

  const providers = await container.resolve(Modules.PAYMENT).listPaymentProviders({ id: [PROVIDER_ID] })
  if (!providers.some(provider => provider.id === PROVIDER_ID && provider.is_enabled)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Set STRIPE_API_KEY and restart the backend before assigning Stripe to regions.")
  }

  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2", "payment_providers.id"],
  })
  const regions = data.filter(region => region.countries?.some(country => countries.includes(country?.iso_2 ?? "")))
  if (countries.some(code => !regions.some(region => region.countries?.some(country => country?.iso_2 === code))) ||
    regions.some(region => !Array.isArray(region.payment_providers))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Could not resolve every requested country's existing payment methods. No regions were changed.")
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  for (const region of regions) {
    const previous = region.payment_providers?.map(provider => provider?.id).filter((id): id is string => !!id) ?? []
    const next = [...new Set([...previous, PROVIDER_ID])]
    if (next.length !== previous.length) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: region.id }, update: { payment_providers: next } },
      })
    }
    logger.info(JSON.stringify({ action: "enable-stripe", region: region.id, name: region.name, currency: region.currency_code, previous, enabled: next }))
  }
  return { regions: regions.map(region => region.id), provider: PROVIDER_ID }
}
