import { preparePaygateSession } from "../paygate-guards"
import { GET as config } from "../store/paygate/config/route"
import { GET as checkout } from "../paygate/checkout/[id]/route"

describe("retired payment checkout", () => {
  it.each(["pp_paygate_card", "pp_paygate_crypto"])("blocks new %s sessions before querying or contacting a gateway", async provider_id => {
    const resolve = jest.fn()
    const req = { body: { provider_id }, params: { id: "pay_col_test" }, scope: { resolve } } as unknown as Parameters<typeof preparePaygateSession>[0]
    const next = jest.fn()
    await preparePaygateSession(req, {} as Parameters<typeof preparePaygateSession>[1], next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ type: "not_allowed", message: expect.stringContaining("no longer available") }))
    expect(resolve).not.toHaveBeenCalled()
  })

  it("advertises neither card nor crypto even to an older storefront", async () => {
    const res = { setHeader: jest.fn(), json: jest.fn() }
    await config({} as Parameters<typeof config>[0], res as unknown as Parameters<typeof config>[1])
    expect(res.json).toHaveBeenCalledWith({ card: false, crypto: false })
  })

  it("expires previous hosted-checkout links without redirecting the shopper", async () => {
    const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() }
    await checkout({} as Parameters<typeof checkout>[0], res as unknown as Parameters<typeof checkout>[1])
    expect(res.status).toHaveBeenCalledWith(410)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("no longer available") }))
  })
})
