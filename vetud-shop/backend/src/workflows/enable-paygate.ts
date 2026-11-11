import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { getPaygateConfig, PAYGATE_CARD, PAYGATE_CRYPTO } from "../lib/paygate-config"

const enablePaygateStep = createStep("enable-paygate", async (_input: Record<string, never>, { container }) => {
  const config = getPaygateConfig()
  const providers = config.enabled ? [...(config.cardWallet ? [PAYGATE_CARD] : []), ...(Object.keys(config.wallets).length ? [PAYGATE_CRYPTO] : [])] : []
  if (!providers.length) return new StepResponse([])
  const { data: regions } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "region", fields: ["id", "payment_providers.id"], pagination: { take: 1000 } })
  const changed: string[] = []
  for (const region of regions) {
    const previous = (region.payment_providers ?? []).flatMap(provider => provider?.id ? [provider.id] : [])
    const current = [...new Set([...previous, ...providers])]
    if (current.length === previous.length) continue
    await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { payment_providers: current } } })
    changed.push(region.id)
  }
  return new StepResponse(changed)
})

/** Idempotent enablement; preserves every existing method. Safe to rerun after partial failure. */
export const enablePaygateWorkflow = createWorkflow("enable-paygate", function (input: Record<string, never>) {
  return new WorkflowResponse(enablePaygateStep(input))
})
