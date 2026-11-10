import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { isPaygate } from "../lib/paygate-config"

type Change = { id: string; previous: string[]; current: string[] }

const retirePaygateStep = createStep("retire-paygate", async (_input: Record<string, never>, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "payment_providers.id"], pagination: { take: 1000 } })
  const changes: Change[] = []
  for (const region of regions) {
    const previous = (region.payment_providers ?? []).flatMap(provider => provider?.id ? [provider.id] : [])
    const current = previous.filter(id => !isPaygate(id))
    if (current.length === previous.length) continue
    await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { payment_providers: current } } })
    changes.push({ id: region.id, previous, current })
  }
  return new StepResponse(changes, changes)
}, async (changes: Change[] | undefined, { container }) => {
  for (const change of changes ?? []) {
    await updateRegionsWorkflow(container).run({ input: { selector: { id: change.id }, update: { payment_providers: change.previous } } })
  }
})

/** Remove checkout availability while retaining legacy payment records and settlement handlers. */
export const retirePaygateWorkflow = createWorkflow("retire-paygate", function (input: Record<string, never>) {
  return new WorkflowResponse(retirePaygateStep(input))
})
