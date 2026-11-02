import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendDeliveryNotificationWorkflow } from "../workflows/send-delivery-notification"

export default async function deliveryCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  // Admins can tick "send notification" off when marking the fulfillment delivered.
  if (data.no_notification) {
    return
  }

  await sendDeliveryNotificationWorkflow(container).run({
    input: { fulfillment_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}
