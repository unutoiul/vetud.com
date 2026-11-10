import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendPaymentReceivedWorkflow } from "../workflows/send-payment-received"

export default async function paymentCapturedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendPaymentReceivedWorkflow(container).run({
    input: { id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
