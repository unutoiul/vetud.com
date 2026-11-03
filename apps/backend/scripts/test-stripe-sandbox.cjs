// Exercises the real local Store API and Stripe sandbox. Never accepts remote Medusa or live keys.
const assert = require("node:assert/strict")
const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const dotenv = require("dotenv")
const Medusa = require("../../storefront/node_modules/@medusajs/js-sdk").default
const Stripe = require(require.resolve("stripe", { paths: [path.resolve(__dirname, "../node_modules/@medusajs/payment-stripe")] }))

const root = path.resolve(__dirname, "..")
const env = dotenv.parse(fs.readFileSync(path.join(root, ".env")))
const storefront = dotenv.parse(fs.readFileSync(path.resolve(root, "../storefront/.env.local")))
const local = value => ["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname)
assert(local(env.DATABASE_URL), "Sandbox checkout requires the local database")
assert(local(storefront.NEXT_PUBLIC_MEDUSA_BACKEND_URL), "Sandbox checkout requires a local Store API")
assert(/^(sk|rk)_test_/.test(env.STRIPE_API_KEY), "A Stripe sandbox key is required")
assert(!env.RESEND_API_KEY, "Temporarily clear the local Resend key and restart Medusa before sandbox checkout tests")

async function main() {
  const sdk = new Medusa({ baseUrl: storefront.NEXT_PUBLIC_MEDUSA_BACKEND_URL, publishableKey: storefront.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY })
  const stripe = new Stripe(env.STRIPE_API_KEY)
  const { regions } = await sdk.store.region.list({ fields: "id,currency_code,countries.iso_2,payment_providers.id" })
  const region = regions.find(region => region.countries?.some(country => country.iso_2 === "gb"))
  assert(region?.payment_providers?.some(provider => provider.id === "pp_stripe_stripe"), "Enable Stripe on the local UK region first")
  const { products } = await sdk.store.product.list({ region_id: region.id, limit: 1, fields: "id,variants.id" })
  const variant = products[0]?.variants?.[0]
  assert(variant, "The local catalog needs an in-stock product")

  const email = `stripe-sandbox-${crypto.randomUUID()}@example.com`
  const password = crypto.randomBytes(24).toString("base64url")
  const token = await sdk.auth.register("customer", "emailpass", { email, password })
  const headers = { authorization: `Bearer ${token}` }
  const { customer } = await sdk.store.customer.create({ email, first_name: "Sandbox", last_name: "Checkout" }, {}, headers)
  const login = await sdk.auth.login("customer", "emailpass", { email, password })
  headers.authorization = `Bearer ${login}`
  const address = { first_name: "Sandbox", last_name: "Checkout", address_1: "1 Test Street", city: "London", postal_code: "SW1A 1AA", country_code: "gb" }
  let { cart } = await sdk.store.cart.create({ region_id: region.id, email, shipping_address: address, billing_address: address }, {}, headers)
  assert.equal(cart.customer_id, customer.id)
  ;({ cart } = await sdk.store.cart.createLineItem(cart.id, { variant_id: variant.id, quantity: 1 }, {}, headers))
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id }, headers)
  assert(shipping_options[0], "The local cart needs a shipping option")
  ;({ cart } = await sdk.store.cart.addShippingMethod(cart.id, { option_id: shipping_options[0].id }, {}, headers))
  const { payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_stripe_stripe",
    data: { capture_method: "automatic", confirm: true, payment_method: "pm_card_chargeDeclined" },
  }, {}, headers)
  const session = payment_collection.payment_sessions.find(session => session.provider_id === "pp_stripe_stripe")
  const intent = await stripe.paymentIntents.retrieve(session.data.id)
  assert.equal(intent.livemode, false)
  assert.equal(intent.status, "requires_payment_method")
  assert.equal(intent.capture_method, "manual")
  assert.equal(intent.amount, Math.round(Number(cart.total) * 100))
  assert.equal(intent.currency, cart.currency_code)
  assert.equal(intent.metadata.session_id, session.id)
  assert.deepEqual(intent.payment_method_types, ["card"])
  assert.equal(intent.automatic_payment_methods.allow_redirects, "never")
  let declined = false
  try {
    await stripe.paymentIntents.confirm(intent.id, { payment_method: "pm_card_chargeDeclined" })
  } catch (error) {
    assert.equal(error.code, "card_declined")
    declined = true
  }
  assert(declined, "The declined test card must fail")
  const confirmed = await stripe.paymentIntents.confirm(intent.id, { payment_method: "pm_card_visa" })
  assert.equal(confirmed.status, "requires_capture")
  const completed = await sdk.store.cart.complete(cart.id, {}, headers)
  assert.equal(completed.type, "order", completed.error?.message)
  const report = { account: (await stripe.accounts.retrieve()).id, cart: cart.id, order: completed.order.id,
    intent: intent.id, session: session.id, amount: Number(cart.total), currency: cart.currency_code,
    checks: ["Store API cart", "browser override rejected", "Stripe amount/currency", "cards only", "decline", "authorization", "Medusa order"] }
  fs.writeFileSync(path.resolve(root, "../../output/payments/stripe-sandbox-checkout.json"), JSON.stringify(report, null, 2) + "\n")
  console.log(JSON.stringify(report))
}

main().catch(error => {
  console.error(String(error.message).replace(/[sr]k_(test|live)_\S+/g, "[redacted key]"))
  process.exitCode = 1
})
