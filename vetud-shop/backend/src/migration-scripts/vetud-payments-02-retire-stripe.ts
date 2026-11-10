import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

/**
 * Runs once during deploy (owner's request, 2026-11-11): the shop no longer takes card payments
 * through Stripe. Removes Stripe from every region's payment methods and keeps the others. Past
 * Stripe payments stay on their orders; refunds for them are made in Stripe's Dashboard.
 */
export default async function retireStripe({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "payment_providers.id"], pagination: { take: 1000 } })

  let changed = 0
  for (const region of regions) {
    const providers = (region.payment_providers ?? []).flatMap((provider) => (provider?.id ? [provider.id] : []))
    if (!providers.includes(STRIPE_PROVIDER_ID)) continue
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { payment_providers: providers.filter((id) => id !== STRIPE_PROVIDER_ID) } },
    })
    changed++
  }
  logger.info(`Stripe: removed from ${changed} of ${regions.length} regions.`)
}
