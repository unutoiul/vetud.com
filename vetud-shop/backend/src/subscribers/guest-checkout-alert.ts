import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendGuestCheckoutAlertWorkflow } from "../workflows/send-owner-alerts"

/** Tells the owner when a guest starts checkout. Most cart updates aren't one and send nothing. */
export default async function guestCheckoutAlertHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendGuestCheckoutAlertWorkflow(container).run({ input: { id: data.id } })
}

export const config: SubscriberConfig = {
  event: "cart.updated",
}
