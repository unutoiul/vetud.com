import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { PAYPAL_PROVIDER_ID, planPayPalRegions, type PayPalSetupRegion } from "../lib/paypal-setup"
import type { PayPalModuleService } from "../lib/paypal-module"

/** Defaults to a connection check and dry run. PAYPAL_SETUP_APPLY=true enables live PayPal. */
export default async function enablePayPal({ container }: ExecArgs) {
  const paypal = container.resolve<PayPalModuleService>("paypal_onboarding")
  const { environment } = await paypal.getActiveCredentials()
  const apply = process.env.PAYPAL_SETUP_APPLY === "true"
  if (apply && environment !== "live") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Live checkout cannot be enabled with sandbox credentials.")

  const providers = await container.resolve(Modules.PAYMENT).listPaymentProviders({ id: [PAYPAL_PROVIDER_ID] })
  if (!providers.some(provider => provider.id === PAYPAL_PROVIDER_ID && provider.is_enabled)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The PayPal provider is not registered. Restart the backend after configuring its credentials.")
  const accessToken = await paypal.getAppAccessToken()
  const { data: settings } = await paypal.getSettings()
  if (settings?.paypal_settings?.enabled === false) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Enable the PayPal wallet in Admin settings before assigning regions.")
  const webhookId = settings?.api_details?.webhook_ids?.[environment]
  if (apply && !webhookId) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Finish PayPal connection and webhook registration in Admin before enabling live checkout.")
  if (webhookId) {
    const base = environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
    const response = await fetch(`${base}/v1/notifications/webhooks/${encodeURIComponent(webhookId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
    const webhook = await response.json() as { url?: string; event_types?: { name: string }[] }
    const expected = `${(process.env.MEDUSA_BACKEND_URL || "").replace(/\/$/, "")}/hooks/paypal/webhook`
    if (!response.ok || webhook.url !== expected || !webhook.event_types?.some(event => event.name === "PAYMENT.CAPTURE.COMPLETED" || event.name === "*")) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "PayPal's live webhook does not match this backend or is missing capture events. No regions were changed.")
    }
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code", "countries.iso_2", "payment_providers.id"] })
  const plan = planPayPalRegions(data as PayPalSetupRegion[], (process.env.PAYPAL_REGION_CURRENCIES || "usd,eur,gbp").split(","))
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`PAYPAL_SETUP_PLAN ${JSON.stringify({ environment, credentialsVerified: true, apply, regions: plan })}`)
  if (!apply) {
    logger.info("PayPal connection verified. Dry run complete; no payment methods changed.")
    return
  }
  for (const region of plan) {
    if (region.changed) await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { payment_providers: region.next } } })
    const { data: verified } = await query.graph({ entity: "region", fields: ["id", "payment_providers.id"], filters: { id: region.id } })
    const actual = ((verified[0] as PayPalSetupRegion | undefined)?.payment_providers ?? []).map(provider => provider?.id)
    if (!region.next.every(id => actual.includes(id))) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "PayPal activation could not be verified; check the region before continuing.")
    logger.info(`PayPal verified for ${region.name || region.id} (${region.currency.toUpperCase()}); existing methods preserved.`)
  }
}
