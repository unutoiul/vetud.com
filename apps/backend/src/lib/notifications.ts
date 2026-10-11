/** Fields read for every order email. Totals are computed by Medusa when requested explicitly. */
export const ORDER_EMAIL_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "created_at",
  "item_total",
  "shipping_total",
  "tax_total",
  "discount_total",
  "total",
  "items.id",
  "items.title",
  "items.product_title",
  "items.variant_title",
  "items.quantity",
  "items.unit_price",
  "items.total",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.company",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.province",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_methods.name",
]

/** Store settings for emails, read at send time so they can change without a rebuild. */
export function emailSettings() {
  return {
    storefrontUrl: (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, ""),
    adminUrl: (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, ""),
    ownerEmail: process.env.STORE_OWNER_EMAIL,
    paymentInstructions: process.env.PAYMENT_INSTRUCTIONS,
    bankDetails: process.env.PAYMENT_BANK_DETAILS,
  }
}

/** Query results can hold BigNumber values; a JSON round trip turns them into plain numbers. */
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
