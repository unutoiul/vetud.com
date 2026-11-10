import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PaymentWebhookEvents } from "@medusajs/framework/utils"
import type { NmiWebhookInput } from "../lib/nmi-settlement-webhook"
import { reconcileNmiPaymentWorkflow } from "../workflows/nmi-reconcile-payment"

export default async function nmiPaymentWebhookHandler({ event, container }: SubscriberArgs<NmiWebhookInput>) {
  await reconcileNmiPaymentWorkflow(container).run({ input: event.data })
}

export const config: SubscriberConfig = {
  event: PaymentWebhookEvents.WebhookReceived,
  context: { subscriberId: "nmi-ach-reconciliation" },
}
