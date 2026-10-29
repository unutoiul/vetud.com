import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { getPaygateConfig, PAYGATE_CARD, PAYGATE_CRYPTO, paygateError } from "../lib/paygate-config"

/** Run manually with PAYGATE_REGION_COUNTRIES set to the storefront's supported ISO country codes. */
export default async function enablePaygate({ container }: ExecArgs) {
  const config = getPaygateConfig()
  if (!config.enabled) paygateError("Enable and configure PayGate on both services before assigning it to regions.")
  const countries = [...new Set((process.env.PAYGATE_REGION_COUNTRIES || "").split(",").map(code => code.trim().toLowerCase()).filter(Boolean))]
  if (!countries.length || countries.some(code => !/^[a-z]{2}$/.test(code))) paygateError("Set PAYGATE_REGION_COUNTRIES to the storefront's supported ISO country codes.")
  const providerIds = [
    ...(config.cardWallet ? [PAYGATE_CARD] : []),
    ...(Object.keys(config.wallets).length ? [PAYGATE_CRYPTO] : []),
  ]
  const providers = await container.resolve(Modules.PAYMENT).listPaymentProviders({ id: providerIds })
  if (providerIds.some(id => !providers.some(provider => provider.id === id && provider.is_enabled))) paygateError("The configured PayGate providers are not registered and enabled in Medusa.")

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2", "payment_providers.id"],
  })
  const regions = data.filter(region => region.countries?.some(country => countries.includes(country?.iso_2 ?? "")))
  if (countries.some(code => !regions.some(region => region.countries?.some(country => country?.iso_2 === code)))) paygateError("Some storefront countries have no Medusa region. No payment methods were changed.")
  if (regions.some(region => !Array.isArray(region.payment_providers))) paygateError("Could not read existing region payment methods. No payment methods were changed.")

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  for (const region of regions) {
    const previous = region.payment_providers?.map(provider => provider?.id).filter((id): id is string => !!id) ?? []
    const next = [...new Set([...previous, ...providerIds])]
    if (next.length !== previous.length) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: region.id }, update: { payment_providers: next } },
      })
    }
    logger.info(JSON.stringify({ action: "enable-paygate", region: region.id, name: region.name, currency: region.currency_code, previous, enabled: next }))
  }
  return { regions: regions.map(region => region.id), providers: providerIds }
}
