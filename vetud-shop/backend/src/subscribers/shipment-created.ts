import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendShipmentNotificationWorkflow } from "../workflows/send-shipment-notification"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  // Admins can tick "send notification" off when creating the shipment.
  if (data.no_notification) {
    return
  }

  await sendShipmentNotificationWorkflow(container).run({
    input: { fulfillment_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
