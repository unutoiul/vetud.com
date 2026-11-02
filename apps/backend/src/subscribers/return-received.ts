import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendReturnReceivedNotificationWorkflow } from "../workflows/send-return-received-notification"

export default async function returnReceivedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; return_id: string }>) {
  await sendReturnReceivedNotificationWorkflow(container).run({
    input: { order_id: data.order_id, return_id: data.return_id },
  })
}

export const config: SubscriberConfig = {
  event: "order.return_received",
}
