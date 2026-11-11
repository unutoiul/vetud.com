import type { MedusaContainer } from "@medusajs/framework/types"
import { CallbackToken } from "paygate-to"
import { paygateCheckout } from "../paygate-checkout"
import { sealPaygate, type PaygateState } from "../../lib/paygate-state"

describe("PayGate signed checkout redirect", () => {
  const originalEnv = process.env
  const secret = "a".repeat(64)
  beforeEach(() => {
    process.env = { ...originalEnv, PAYGATE_ENABLED: "true", PAYGATE_CALLBACK_SECRET: secret, PAYGATE_CARD_WALLET: `0x${"1".repeat(40)}`, MEDUSA_BACKEND_URL: "https://backend.example", PAYGATE_CHECKOUT_DOMAIN: "checkout.paygate.to" }
  })
  afterEach(() => { process.env = originalEnv })

  function setup() {
    const state: PaygateState = { session_id: "payses_1", reference: "payses_1.ref", cart_id: "cart_1", mode: "card", amount: "100", currency: "USD", expected_usd: "100", min_net_ratio: "1", payout_wallets: [], deposit_address: "", checkout_url: "https://checkout.paygate.to/pay.php?invoice=1", redirect_token: "", receipts: [], settled: false, canceled: false, review: "" }
    const token = new CallbackToken(secret).sign(`redirect:${state.reference}`)
    state.redirect_token = token
    const session = { id: state.session_id, provider_id: "pp_paygate_card", payment_collection_id: "paycol_1", amount: 100, currency_code: "usd", status: "pending_authorization", data: { paygate: sealPaygate(state, secret) } }
    const order = { id: "order_1", status: "pending", total: 100, currency_code: "usd", payment_collections: [{ id: "paycol_1" }] }
    const graph = jest.fn(async () => ({ data: [{ order }] }))
    const container = { resolve: (name: string) => name === "payment" ? { retrievePaymentSession: async () => session } : { graph } } as unknown as MedusaContainer
    return { state, session, order, graph, container, input: { session_id: session.id, token } }
  }

  it("opens the existing invoice after the domain move, using the backend's signed capability", async () => {
    const test = setup()
    process.env.STOREFRONT_URL = "https://www.pep.company"
    await expect(paygateCheckout(test.input, test.container)).resolves.toEqual({ url: test.state.checkout_url })
  })
  it.each(["token", "mac", "amount", "currency", "collection", "order", "paid", "canceled", "review", "origin"])("rejects invalid %s without issuing a redirect", async kind => {
    const test = setup()
    if (kind === "token") test.input.token = "b".repeat(64)
    if (kind === "mac") test.session.data.paygate.amount = "101"
    if (kind === "amount") test.order.total = 101
    if (kind === "currency") test.session.currency_code = "eur"
    if (kind === "collection") test.order.payment_collections = [{ id: "other" }]
    if (kind === "order") test.order.status = "canceled"
    if (kind === "paid") test.state.settled = true
    if (kind === "canceled") test.state.canceled = true
    if (kind === "review") test.state.review = "underpaid"
    if (kind === "origin") test.state.checkout_url = "https://attacker.example/pay"
    if (["paid", "canceled", "review", "origin"].includes(kind)) test.session.data.paygate = sealPaygate(test.state, secret)
    await expect(paygateCheckout(test.input, test.container)).rejects.toThrow()
  })
})
