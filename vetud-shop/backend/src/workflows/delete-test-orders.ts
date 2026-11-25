import { Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

/**
 * Hides test orders (owner, 2026-11-25): a soft delete, so they leave Admin and customer accounts but
 * the rows stay in the database and can be restored. Used by src/scripts/delete-test-orders.ts.
 */
const softDeleteOrdersStep = createStep(
  "soft-delete-orders",
  async (input: { order_ids: string[] }, { container }) => {
    if (!input.order_ids.length) return new StepResponse({ deleted: 0 }, [] as string[])
    await container.resolve(Modules.ORDER).softDeleteOrders(input.order_ids)
    return new StepResponse({ deleted: input.order_ids.length }, input.order_ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    await container.resolve(Modules.ORDER).restoreOrders(ids)
  }
)

export const deleteTestOrdersWorkflow = createWorkflow("delete-test-orders", function (input: { order_ids: string[] }) {
  return new WorkflowResponse(softDeleteOrdersStep(input))
})
