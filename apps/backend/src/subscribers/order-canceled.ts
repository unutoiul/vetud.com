import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderCanceledNotificationWorkflow } from "../workflows/send-order-canceled-notification"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderCanceledNotificationWorkflow(container).run({
    input: { id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
