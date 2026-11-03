const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { createRequire } = require("node:module")
const requireBackend = createRequire(path.resolve(process.cwd(), "package.json"))
const { Modules } = requireBackend("@medusajs/framework/utils")
const { capturePaymentWorkflow, refundPaymentWorkflow } = requireBackend("@medusajs/medusa/core-flows")
const Stripe = requireBackend(requireBackend.resolve("stripe", { paths: [path.resolve(process.cwd(), "node_modules/@medusajs/payment-stripe")] }))

// Run by Medusa exec after test-stripe-sandbox.cjs creates the local test order.
exports.default = async ({ container }) => {
  assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname))
  assert(/^(sk|rk)_test_/.test(process.env.STRIPE_API_KEY), "A sandbox key is required")
  assert(!process.env.RESEND_API_KEY, "Disable outbound email before sandbox checkout tests")
  const file = path.resolve(process.cwd(), "../../output/payments/stripe-sandbox-checkout.json")
  const report = JSON.parse(fs.readFileSync(file))
  const stripe = new Stripe(process.env.STRIPE_API_KEY)
  assert.equal((await stripe.accounts.retrieve()).id, report.account)
  const payments = container.resolve(Modules.PAYMENT)
  let rows = await payments.listPayments({ payment_session_id: report.session }, { relations: ["captures", "refunds"] })
  assert.equal(rows.length, 1)
  const id = rows[0].id
  if (!rows[0].captures.length) await capturePaymentWorkflow(container).run({ input: { payment_id: id } })
  const captured = await stripe.paymentIntents.retrieve(report.intent)
  assert.equal(captured.livemode, false)
  assert.equal(captured.status, "succeeded")
  assert.equal(captured.amount_received, Math.round(report.amount * 100))

  // Exercise the actual HTTP signature verifier/queue with a real sandbox event's body.
  // Signing locally avoids a public tunnel; external Stripe delivery is checked at deployment.
  const events = await stripe.events.list({ type: "payment_intent.succeeded", limit: 10 })
  const event = events.data.find(event => event.data.object.id === report.intent)
  assert(event, "Expected the sandbox payment success event")
  const raw = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({ payload: raw, secret: process.env.STRIPE_WEBHOOK_SECRET })
  for (let i = 0; i < 2; i++) {
    const response = await fetch("http://localhost:9000/hooks/payment/stripe_stripe", {
      method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature }, body: raw,
    })
    assert(response.ok, `Webhook returned ${response.status}`)
  }
  await new Promise(resolve => setTimeout(resolve, 1500))
  rows = await payments.listPayments({ id }, { relations: ["captures", "refunds"] })
  assert.equal(rows[0].captures.length, 1, "Duplicate webhooks must not duplicate captures")
  if (!rows[0].refunds.length) {
    await refundPaymentWorkflow(container).run({ input: { payment_id: id, note: "Local Stripe sandbox integration verification" } })
  }
  rows = await payments.listPayments({ id }, { relations: ["captures", "refunds"] })
  assert.equal(rows[0].refunds.length, 1)
  const refunds = await stripe.refunds.list({ payment_intent: report.intent })
  assert.equal(refunds.data.length, 1)
  assert.equal(refunds.data[0].amount, Math.round(report.amount * 100))
  assert.equal(refunds.data[0].status, "succeeded")
  report.payment = id
  report.refund = refunds.data[0].id
  report.checks = [...new Set([...report.checks, "Medusa capture workflow", "signed webhook HTTP delivery",
    "duplicate webhook idempotency", "Medusa refund workflow", "Stripe full refund"])]
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n")
  console.log("STRIPE_SANDBOX_RESULT " + JSON.stringify(report))
}
