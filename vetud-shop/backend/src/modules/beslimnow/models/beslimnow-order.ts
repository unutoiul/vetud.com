import { model } from "@medusajs/framework/utils"

/**
 * Every order from the BeSlimNow pen page (be-slim-now/, a separate site that shares this database).
 * Not a Medusa order: the page has its own form and takes payment by hand. `source` is always
 * "beslimnow" so a row's site is clear wherever it is read. Change `status` by hand as payment
 * arrives and parcels ship.
 */
const BeslimnowOrder = model
  .define(
    { name: "BeslimnowOrder", tableName: "beslimnow_orders" },
    {
      id: model.id({ prefix: "bsno" }).primaryKey(),
      source: model.text().default("beslimnow"),
      order_number: model.text().unique(),
      placed_at: model.dateTime(),
      status: model.enum(["awaiting_payment", "paid", "shipped", "cancelled"]).default("awaiting_payment"),
      product: model.enum(["tz2", "retatrutide"]),
      // "20mg" or "40mg" (checked by the route; enum values cannot start with a digit).
      strength: model.text(),
      quantity: model.number(),
      currency: model.text(),
      unit_regular: model.bigNumber(),
      unit_price: model.bigNumber(),
      regular_total: model.bigNumber(),
      subtotal: model.bigNumber(),
      code_discount: model.bigNumber(),
      total: model.bigNumber(),
      promo_code: model.text().nullable(),
      name: model.text(),
      email: model.text(),
      phone: model.text(),
      contact_app: model.text(),
      contact_handle: model.text().nullable(),
      country: model.text(),
      address: model.text(),
      city: model.text(),
      postal_code: model.text(),
      note: model.text().nullable(),
      research_use_confirmed: model.boolean(),
      // Whether the buyer's confirmation email went out (false = follow up by hand).
      confirmation_sent: model.boolean().default(false),
    }
  )
  .indexes([{ on: ["placed_at"] }, { on: ["email"] }, { on: ["status"] }])

export default BeslimnowOrder
