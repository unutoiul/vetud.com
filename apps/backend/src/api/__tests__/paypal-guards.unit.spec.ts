import { preparePayPalSession, requirePayPalAvailable, requirePayPalCart } from "../paypal-guards"

const cart = { id: "cart_1", customer_id: "cus_1", total: 42.5, currency_code: "gbp", payment_collection: { payment_sessions: [{ provider_id: "pp_paypal_paypal", data: { paypal: { order_id: "PAYPAL123456" } } }] } }
const order = { purchase_units: [{ amount: { value: "42.50", currency_code: "GBP" } }] }
type Request = Parameters<typeof requirePayPalCart>[0]
const request = (body: object, data: unknown[] = [cart], paypal = {}) => ({
  body, params: { id: "paycol_1" }, auth_context: { actor_id: "cus_1" },
  scope: { resolve: (key: string) => key === "query" ? { graph: async () => ({ data }) } : { getOrderDetails: async () => order, getActiveCredentials: async () => ({ environment: "live" }), getSettings: async () => ({ data: {} }), ...paypal } },
}) as unknown as Request
const run = (middleware: typeof requirePayPalCart, req: Request) => new Promise<unknown>(resolve => { void middleware(req, {} as Parameters<typeof middleware>[1], error => resolve(error)) })

describe("PayPal plugin checkout guards", () => {
  it("discards forged completed-capture data before creating a payment session", async () => {
    const req = request({ provider_id: "pp_paypal_paypal", data: { paypal: { capture: { status: "COMPLETED" } } } }, [{ cart }])
    expect(await run(preparePayPalSession as typeof requirePayPalCart, req)).toBeUndefined()
    expect(req.body).toEqual({ provider_id: "pp_paypal_paypal", data: {} })
  })

  it("rejects another customer's payment collection and checkout cart", async () => {
    const foreign = { ...cart, customer_id: "cus_2" }
    expect(await run(preparePayPalSession as typeof requirePayPalCart, request({ provider_id: "pp_paypal_paypal" }, [{ cart: foreign }]))).toMatchObject({ type: "not_allowed" })
    expect(await run(requirePayPalCart, request({ cart_id: cart.id }, [foreign]))).toMatchObject({ type: "not_allowed" })
  })

  it("allows capture only for the cart's PayPal order at the current amount and currency", async () => {
    expect(await run(requirePayPalCart, request({ cart_id: cart.id, order_id: "PAYPAL123456" }))).toBeUndefined()
    for (const changed of [{ ...cart, total: 1 }, { ...cart, currency_code: "usd" }]) expect(await run(requirePayPalCart, request({ cart_id: cart.id, order_id: "PAYPAL123456" }, [changed]))).toMatchObject({ type: "not_allowed" })
    expect(await run(requirePayPalCart, request({ cart_id: cart.id, order_id: "OTHERPAYPAL123" }))).toMatchObject({ type: "not_allowed" })
  })

  it("fails closed if PayPal cannot verify the amount, and rejects unsupported card checkout", async () => {
    expect(await run(requirePayPalCart, request({ cart_id: cart.id, order_id: "PAYPAL123456" }, [cart], { getOrderDetails: async () => { throw new Error("unavailable") } }))).toBeInstanceOf(Error)
    expect(await run(requirePayPalCart, request({ cart_id: cart.id, is_card_payment: true }))).toMatchObject({ type: "invalid_data" })
  })

  it("rejects sandbox production, disconnected and disabled accounts", async () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    try {
      expect(await run(requirePayPalAvailable, request({}))).toBeUndefined()
      for (const paypal of [{ getActiveCredentials: async () => ({ environment: "sandbox" }) }, { getActiveCredentials: async () => { throw new Error("disconnected") } }, { getSettings: async () => ({ data: { paypal_settings: { enabled: false } } }) }]) expect(await run(requirePayPalAvailable, request({}, [cart], paypal))).toMatchObject({ type: "not_allowed" })
    } finally { process.env.NODE_ENV = previous }
  })
})
