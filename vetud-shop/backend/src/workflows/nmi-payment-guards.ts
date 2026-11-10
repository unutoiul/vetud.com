import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  assertNmiManualCaptureAllowed, assertNmiPaymentCanFulfill, nmiError,
  NMI_PROVIDER_ID,
} from "../lib/nmi-settlement"

export type NmiPaymentGuardInput =
  | { action: "capture"; payment_id: string; amount?: unknown }
  | { action: "fulfillment" | "shipment"; order_id: string }

type OrderPayments = {
  id: string
  payment_collections?: {
    payments?: { id: string; provider_id: string }[]
    payment_sessions?: { id: string; provider_id: string; status: string }[]
  }[]
}

/** A pre-effect guard for the core admin routes; unrelated providers pass through. */
export async function executeNmiPaymentGuard(input: NmiPaymentGuardInput, container: MedusaContainer) {
  const payments = container.resolve(Modules.PAYMENT)
  if (input.action === "capture") {
    if (!input.payment_id) nmiError("Missing payment identity for NMI capture validation.")
    const payment = await payments.retrievePayment(input.payment_id, { relations: ["payment_session"] })
    assertNmiManualCaptureAllowed(payment, input.amount)
    return { allowed: true }
  }
  if (!input.order_id) nmiError("Missing order identity for NMI fulfillment validation.")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id", "payment_collections.payments.id", "payment_collections.payments.provider_id",
      "payment_collections.payment_sessions.id", "payment_collections.payment_sessions.provider_id",
      "payment_collections.payment_sessions.status",
    ],
    filters: { id: input.order_id },
  }, { throwIfKeyNotFound: true })
  const order = data[0] as OrderPayments | undefined
  if (!order || order.id !== input.order_id) nmiError("Order was not found for NMI fulfillment validation.")
  for (const collection of order.payment_collections ?? []) {
    const paymentRows = collection.payments ?? []
    if (!paymentRows.length && collection.payment_sessions?.some((session) =>
      session.provider_id === NMI_PROVIDER_ID && !["canceled", "error"].includes(session.status))) {
      nmiError("The NMI payment is not authorized; fulfillment and shipment are on hold.")
    }
    for (const row of paymentRows) {
      if (row.provider_id !== NMI_PROVIDER_ID) continue
      // Query only locates the payment. Read current metadata from the module.
      const payment = await payments.retrievePayment(row.id, { relations: ["payment_session"] })
      assertNmiPaymentCanFulfill(payment, input.action)
    }
  }
  return { allowed: true }
}

const guardNmiPaymentStep = createStep("guard-nmi-payment", async (input: NmiPaymentGuardInput, { container }) => {
  return new StepResponse(await executeNmiPaymentGuard(input, container))
})

export const guardNmiPaymentWorkflow = createWorkflow("guard-nmi-payment", (input: NmiPaymentGuardInput) => {
  return new WorkflowResponse(guardNmiPaymentStep(input))
})
