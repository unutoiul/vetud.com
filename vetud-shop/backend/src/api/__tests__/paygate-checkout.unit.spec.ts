import { preparePaygateSession } from "../paygate-guards"
import { GET as config } from "../store/paygate/config/route"
import { preparePaygateWorkflow } from "../../workflows/paygate"

jest.mock("../../workflows/paygate", () => ({ preparePaygateWorkflow: jest.fn(), guardPaygateFulfillmentWorkflow: jest.fn() }))

describe("PayGate checkout availability", () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, PAYGATE_ENABLED: "true", PAYGATE_CALLBACK_SECRET: "a".repeat(64), PAYGATE_CARD_WALLET: `0x${"1".repeat(40)}`, PAYGATE_CRYPTO_WALLETS: "{}", MEDUSA_BACKEND_URL: "https://backend.example" }
  })
  afterEach(() => { process.env = originalEnv; jest.clearAllMocks() })

  it("exposes only configured payment modes", async () => {
    const res = { setHeader: jest.fn(), json: jest.fn() }
    await config({} as never, res as never)
    expect(res.json).toHaveBeenCalledWith({ card: true, crypto: false })
    process.env.PAYGATE_ENABLED = "false"
    await config({} as never, res as never)
    expect(res.json).toHaveBeenLastCalledWith({ card: false, crypto: false })
  })

  it.each(["pp_paygate_card", "pp_paygate_crypto"])("blocks disabled %s without contacting a gateway", async provider_id => {
    process.env.PAYGATE_ENABLED = "false"
    const resolve = jest.fn()
    const next = jest.fn()
    await preparePaygateSession({ body: { provider_id }, scope: { resolve } } as never, {} as never, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("unavailable") }))
    expect(resolve).not.toHaveBeenCalled()
  })

  it("binds a new payment to the server-verified cart and customer", async () => {
    const run = jest.fn().mockResolvedValue({ result: { cart_id: "cart_1", email: "buyer@example.com" } })
    jest.mocked(preparePaygateWorkflow).mockReturnValue({ run } as never)
    const req = { body: { provider_id: "pp_paygate_card", data: {} }, params: { id: "paycol_1" }, auth_context: { actor_id: "cus_1" }, scope: {} }
    const next = jest.fn()
    await preparePaygateSession(req as never, {} as never, next)
    expect(run).toHaveBeenCalledWith({ input: { payment_collection_id: "paycol_1", customer_id: "cus_1", data: {} } })
    expect(req.body.data).toEqual({ cart_id: "cart_1", email: "buyer@example.com" })
    expect(next).toHaveBeenCalledWith()
  })
})
