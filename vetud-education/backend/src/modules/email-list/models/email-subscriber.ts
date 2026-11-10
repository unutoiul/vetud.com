import { model } from "@medusajs/framework/utils"

/**
 * Someone who asked for new guides by email. They stay "pending" until they confirm from the email
 * we send them, and only "confirmed" addresses may receive the list. This list is separate from the
 * shop's newsletter, and the two are never merged.
 */
const EmailSubscriber = model.define("email_subscriber", {
  id: model.id({ prefix: "esub" }).primaryKey(),
  email: model.text(),
  locale: model.text().default("en"),
  status: model.enum(["pending", "confirmed", "unsubscribed"]).default("pending"),
  // The exact wording the visitor ticked.
  consent_text: model.text(),
  consent_version: model.text(),
  consented_at: model.dateTime(),
  confirmation_sent_at: model.dateTime().nullable(),
  confirmed_at: model.dateTime().nullable(),
  unsubscribed_at: model.dateTime().nullable(),
}).indexes([
  { name: "IDX_email_subscriber_email", on: ["email"], unique: true, where: "deleted_at IS NULL" },
])

export default EmailSubscriber
