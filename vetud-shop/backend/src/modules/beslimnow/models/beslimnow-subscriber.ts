import { model } from "@medusajs/framework/utils"

/**
 * Emails from the BeSlimNow page's "extra 10%" pop-up, one row per address. `source` is always
 * "beslimnow"; `signup_form` says which form on that page the address came from.
 */
const BeslimnowSubscriber = model.define(
  { name: "BeslimnowSubscriber", tableName: "beslimnow_subscribers" },
  {
    id: model.id({ prefix: "bsns" }).primaryKey(),
    source: model.text().default("beslimnow"),
    email: model.text().unique(),
    country: model.text().nullable(),
    signup_form: model.text().default("promo-popup"),
    subscribed_at: model.dateTime(),
    // Updated each time the same address asks for the code again.
    last_seen_at: model.dateTime(),
    times_subscribed: model.number().default(1),
  }
)

export default BeslimnowSubscriber
