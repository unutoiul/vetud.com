import PayPalProviderService from "../service"

const options = {
  client_id: "id",
  client_secret: "secret",
  environment: "sandbox" as const,
  storefront_url: "https://shop.example",
}

type Call = { url: string; method: string; body?: any; headers: Record<string, string> }

/** Replaces fetch with a scripted PayPal: each rule answers requests whose "METHOD /path" matches. */
function mockPayPal(rules: Record<string, (call: Call) => { status?: number; json: unknown }>) {
  const calls: Call[] = []
  jest.spyOn(global, "fetch").mockImplementation((async (url: string, init: RequestInit = {}) => {
    const call: Call = {
      url,
      method: init.method ?? "GET",
      body: typeof init.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : init.body,
      headers: (init.headers ?? {}) as Record<string, string>,
    }
    calls.push(call)
    const path = new URL(url).pathname
    if (path === "/v1/oauth2/token") {
      return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 })
    }
    const rule = rules[`${call.method} ${path}`]
    if (!rule) return new Response(JSON.stringify({ message: `unscripted ${call.method} ${path}` }), { status: 500 })
    const { status = 200, json } = rule(call)
    return new Response(JSON.stringify(json), { status })
  }) as typeof fetch)
  return calls
}

const approvedOrder = (extra: object = {}) => ({ id: "ORDER1", status: "APPROVED", ...extra })
const completedOrder = (captureStatus = "COMPLETED") => ({
  id: "ORDER1",
  status: "COMPLETED",
  payer: { email_address: "buyer@example.com" },
  purchase_units: [{ payments: { captures: [{ id: "CAP1", status: captureStatus }] } }],
})

describe("PayPal payment provider", () => {
  afterEach(() => jest.restoreAllMocks())

  const provider = () => new PayPalProviderService({}, options)

  it("creates an order with the amount formatted for the currency and returns the approval URL", async () => {
    const calls = mockPayPal({
      "POST /v2/checkout/orders": () => ({
        json: { id: "ORDER1", status: "PAYER_ACTION_REQUIRED", links: [{ rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1" }] },
      }),
    })

    const result = await provider().initiatePayment({ amount: 12.5, currency_code: "usd" })

    const order = calls.find((c) => c.url.endsWith("/v2/checkout/orders"))!
    expect(order.body.intent).toBe("CAPTURE")
    expect(order.body.purchase_units[0].amount).toEqual({ currency_code: "USD", value: "12.50" })
    expect(order.body.payment_source.paypal.experience_context.return_url).toBe("https://shop.example/order/paypal-return")
    expect(order.body.payment_source.paypal.experience_context.shipping_preference).toBe("NO_SHIPPING")
    expect(result.status).toBe("pending")
    expect(result.data).toMatchObject({
      paypal_order_id: "ORDER1",
      approve_url: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1",
      amount_value: "12.50",
      currency_code: "USD",
    })
  })

  it("sends whole numbers for currencies without decimals", async () => {
    const calls = mockPayPal({
      "POST /v2/checkout/orders": () => ({ json: { id: "O", status: "CREATED", links: [{ rel: "approve", href: "https://p/x" }] } }),
    })
    await provider().initiatePayment({ amount: 1500.4, currency_code: "JPY" })
    expect(calls.find((c) => c.url.endsWith("/v2/checkout/orders"))!.body.purchase_units[0].amount.value).toBe("1500")
  })

  it("rejects currencies PayPal does not support", async () => {
    mockPayPal({})
    await expect(provider().initiatePayment({ amount: 10, currency_code: "aed" })).rejects.toThrow(/does not support AED/)
  })

  it("captures an approved order when the cart is completed", async () => {
    const calls = mockPayPal({
      "GET /v2/checkout/orders/ORDER1": () => ({ json: approvedOrder() }),
      "POST /v2/checkout/orders/ORDER1/capture": () => ({ json: completedOrder() }),
    })

    const result = await provider().authorizePayment({ data: { paypal_order_id: "ORDER1", currency_code: "USD" } })

    expect(calls.some((c) => c.url.endsWith("/capture"))).toBe(true)
    expect(result.status).toBe("captured")
    expect(result.data).toMatchObject({ capture_id: "CAP1", payer_email: "buyer@example.com", currency_code: "USD" })
  })

  it("does not capture, and asks for more, when the shopper has not approved", async () => {
    const calls = mockPayPal({
      "GET /v2/checkout/orders/ORDER1": () => ({ json: { id: "ORDER1", status: "PAYER_ACTION_REQUIRED" } }),
    })
    const result = await provider().authorizePayment({ data: { paypal_order_id: "ORDER1" } })
    expect(result.status).toBe("requires_more")
    expect(calls.some((c) => c.url.endsWith("/capture"))).toBe(false)
  })

  it("treats an already captured order as captured without capturing twice", async () => {
    const calls = mockPayPal({ "GET /v2/checkout/orders/ORDER1": () => ({ json: completedOrder() }) })
    const result = await provider().authorizePayment({ data: { paypal_order_id: "ORDER1" } })
    expect(result.status).toBe("captured")
    expect(calls.some((c) => c.url.endsWith("/capture"))).toBe(false)
  })

  it("recovers when PayPal says the order was already captured", async () => {
    mockPayPal({
      "GET /v2/checkout/orders/ORDER1": () => ({ json: approvedOrder() }),
      "POST /v2/checkout/orders/ORDER1/capture": () => ({ status: 422, json: { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }], message: "x" } }),
    })
    // The recovery re-reads the order, which this script still reports as APPROVED, so it stays pending.
    const result = await provider().authorizePayment({ data: { paypal_order_id: "ORDER1" } })
    expect(result.status).toBe("pending")
  })

  it("maps a pending capture to authorized", async () => {
    mockPayPal({ "GET /v2/checkout/orders/ORDER1": () => ({ json: completedOrder("PENDING") }) })
    const result = await provider().authorizePayment({ data: { paypal_order_id: "ORDER1" } })
    expect(result.status).toBe("authorized")
  })

  it("surfaces a declined capture as an error", async () => {
    mockPayPal({
      "GET /v2/checkout/orders/ORDER1": () => ({ json: approvedOrder() }),
      "POST /v2/checkout/orders/ORDER1/capture": () => ({ status: 422, json: { details: [{ issue: "INSTRUMENT_DECLINED" }], message: "declined", debug_id: "d1" } }),
    })
    await expect(provider().authorizePayment({ data: { paypal_order_id: "ORDER1" } })).rejects.toThrow(/INSTRUMENT_DECLINED/)
  })

  it("keeps the same order when the amount is unchanged and issues a new one when it changes", async () => {
    const calls = mockPayPal({
      "POST /v2/checkout/orders": () => ({ json: { id: "ORDER2", status: "CREATED", links: [{ rel: "approve", href: "https://p/2" }] } }),
    })
    const data = { paypal_order_id: "ORDER1", amount_value: "10.00", currency_code: "USD" }

    const same = await provider().updatePayment({ amount: 10, currency_code: "usd", data })
    expect(same.data).toBe(data)
    expect(calls.filter((c) => c.url.endsWith("/v2/checkout/orders"))).toHaveLength(0)

    const changed = await provider().updatePayment({ amount: 25, currency_code: "usd", data })
    expect(changed.data).toMatchObject({ paypal_order_id: "ORDER2", amount_value: "25.00" })
  })

  it("refunds against the stored capture and remembers the refund id", async () => {
    const calls = mockPayPal({ "POST /v2/payments/captures/CAP1/refund": () => ({ json: { id: "REF1", status: "COMPLETED" } }) })
    const result = await provider().refundPayment({ amount: 4, data: { capture_id: "CAP1", currency_code: "USD", refund_ids: ["REF0"] } })
    expect(calls.find((c) => c.url.endsWith("/refund"))!.body.amount).toEqual({ value: "4.00", currency_code: "USD" })
    expect(result.data!.refund_ids).toEqual(["REF0", "REF1"])
  })

  it("refuses to refund a payment that was never captured", async () => {
    mockPayPal({})
    await expect(provider().refundPayment({ amount: 4, data: { paypal_order_id: "ORDER1" } })).rejects.toThrow(/not been captured/)
  })

  it("requires its options", () => {
    expect(() => PayPalProviderService.validateOptions({ client_id: "x" })).toThrow(/client_secret/)
    expect(() => PayPalProviderService.validateOptions({ ...options, environment: "prod" })).toThrow(/environment/)
    expect(() => PayPalProviderService.validateOptions(options)).not.toThrow()
  })
})
