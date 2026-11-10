import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderPlacedNotificationsWorkflow } from "../workflows/send-order-placed-notifications"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderPlacedNotificationsWorkflow(container).run({
    input: { id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
