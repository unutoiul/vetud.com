import type { MedusaContainer, UpdatePaymentDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows"
import {
  assertNmiPaymentIdentity, getNmiSettlement, nmiAmount, nmiError,
  NMI_PROVIDER_ID, NMI_SETTLEMENT_METADATA_KEY, readNmiPaymentIdentity,
} from "../lib/nmi-settlement"
import type { NmiSettlement, NmiSettlementPayment } from "../lib/nmi-settlement"
import { verifyNmiWebhook } from "../lib/nmi-settlement-webhook"
import type { NmiWebhookInput, VerifiedNmiEvent } from "../lib/nmi-settlement-webhook"

export const nmiSettlementLockKey = (sessionId: string) => `nmi-settlement:${sessionId}`

async function correlatedPayment(event: VerifiedNmiEvent, container: MedusaContainer) {
  const payments = container.resolve(Modules.PAYMENT)
  const session = await payments.retrievePaymentSession(event.session_id, { relations: ["payment"] })
  if (session.provider_id !== NMI_PROVIDER_ID || session.id !== event.session_id || !session.payment?.id ||
    nmiAmount(session.amount) !== event.amount || session.currency_code !== event.currency_code) {
    nmiError("NMI webhook does not match an authorized payment session; reconciliation is required.")
  }
  const payment = await payments.retrievePayment(session.payment.id, { relations: ["payment_session"] }) as NmiSettlementPayment
  const state = readNmiPaymentIdentity(payment.data)
  assertNmiPaymentIdentity(payment, state)
  if (state.session_id !== event.session_id || state.transactionid !== event.transaction_id ||
    state.payment_method !== "ach" || nmiAmount(state.amount) !== event.amount ||
    state.currency_code !== event.currency_code || payment.payment_collection_id !== session.payment_collection_id) {
    nmiError("NMI webhook payment, transaction, method, or amount does not match; reconciliation is required.")
  }
  return { payment, state }
}

async function persistSettlement(payment: NmiSettlementPayment, settlement: NmiSettlement, container: MedusaContainer) {
  // The runtime Payment model supports metadata; the public DTO omits it in 2.21.
  const update: UpdatePaymentDTO & { metadata: Record<string, unknown> } = {
    id: payment.id,
    metadata: { ...payment.metadata, [NMI_SETTLEMENT_METADATA_KEY]: settlement },
  }
  await container.resolve(Modules.PAYMENT).updatePayment(update)
}

/** HTTP preflight surfaces authentication/correlation errors before core queues a 200. */
export async function validateNmiWebhook(input: NmiWebhookInput, container: MedusaContainer) {
  const event = verifyNmiWebhook(input)
  if (event) await correlatedPayment(event, container)
  return { accepted: true }
}

/** No compensator: rolling back an observed ACH return could release an unsafe hold. */
export async function executeNmiReconciliation(input: NmiWebhookInput, container: MedusaContainer) {
  const event = verifyNmiWebhook(input)
  if (!event) return { status: "ignored" as const }
  const locking = container.resolve(Modules.LOCKING)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    return await locking.execute(nmiSettlementLockKey(event.session_id), async () => {
      // Read AFTER the lock so concurrent settle/return deliveries cannot clobber a hold.
      const { payment, state } = await correlatedPayment(event, container)
      const previous = getNmiSettlement(payment, state)
      const alreadyReturned = previous?.status === "returned" || previous?.status === "late_returned"
      if (alreadyReturned && (event.status === "settled" || previous.status === "late_returned" || event.status === "returned")) {
        return { status: previous.status, payment_id: payment.id, duplicate: true }
      }
      let settlement: NmiSettlement = previous?.status === event.status ? previous : {
        version: 1,
        source: "nmi-hmac-v1",
        payment_id: payment.id,
        provider_id: NMI_PROVIDER_ID,
        session_id: event.session_id,
        transaction_id: event.transaction_id,
        amount: event.amount,
        currency_code: event.currency_code,
        status: event.status,
        hold: event.status !== "settled",
        reconciliation_required: event.status !== "settled",
        event_id: event.event_id,
        event_type: event.event_type,
        received_at: new Date().toISOString(),
        capture_recorded: previous?.capture_recorded ?? false,
      }
      if (settlement !== previous) await persistSettlement(payment, settlement, container)
      if (settlement.hold) {
        logger.warn(`NMI ACH hold payment_id=${payment.id} session_id=${event.session_id} event_id=${event.event_id}`)
        return { status: settlement.status, payment_id: payment.id }
      }
      if (payment.canceled_at || state.canceled) {
        nmiError("Verified ACH settlement belongs to a canceled payment; manual reconciliation is required.")
      }
      if (settlement.capture_recorded) {
        return { status: settlement.status, payment_id: payment.id, duplicate: true }
      }
      // Metadata is committed before the provider checks it. Core records capture,
      // updates collection totals, and creates the order transaction. Never issue a sale.
      // A stable workflow transaction ID also lets an interrupted attempt resume.
      await capturePaymentWorkflow(container).run({
        input: { payment_id: payment.id },
        context: { transactionId: `nmi-settlement-${payment.id}` },
      })
      settlement = { ...settlement, capture_recorded: true }
      await persistSettlement(payment, settlement, container)
      return { status: settlement.status, payment_id: payment.id }
    }, { timeout: 30, expire: 120 })
  } catch {
    // Do not attach underlying gateway errors: plugins may include account/token data.
    logger.error(`NMI reconciliation failed session_id=${event.session_id} event_id=${event.event_id}`)
    nmiError("NMI reconciliation failed; the payment remains held. Review the identifier-only reconciliation log and retry the signed event.")
  }
}

const reconcileNmiPaymentStep = createStep("reconcile-nmi-payment", async (input: NmiWebhookInput, { container }) => {
  return new StepResponse(await executeNmiReconciliation(input, container))
})

export const reconcileNmiPaymentWorkflow = createWorkflow("reconcile-nmi-payment", (input: NmiWebhookInput) => {
  return new WorkflowResponse(reconcileNmiPaymentStep(input))
})

const validateNmiWebhookStep = createStep("validate-nmi-webhook", async (input: NmiWebhookInput, { container }) => {
  return new StepResponse(await validateNmiWebhook(input, container))
})

export const validateNmiWebhookWorkflow = createWorkflow("validate-nmi-webhook", (input: NmiWebhookInput) => {
  return new WorkflowResponse(validateNmiWebhookStep(input))
})
