import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendCustomerWelcomeWorkflow } from "../workflows/send-customer-welcome"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendCustomerWelcomeWorkflow(container).run({
    input: { id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
