import { PAYPAL_PROVIDER_ID, planPayPalRegions } from "../paypal-setup"

const region = (id: string, currency: string, providers = ["pp_system_default", "pp_stripe_stripe"]) => ({ id, currency_code: currency, countries: [{ iso_2: "us" }], payment_providers: providers.map(id => ({ id })) })

describe("PayPal region activation", () => {
  it("retains existing methods and adds PayPal once, including on a retry", () => {
    const plan = planPayPalRegions([region("reg_us", "usd"), region("reg_gb", "gbp", ["pp_system_default", PAYPAL_PROVIDER_ID])], ["USD", "gbp", "usd"])
    expect(plan[0].next).toEqual(["pp_system_default", "pp_stripe_stripe", PAYPAL_PROVIDER_ID])
    expect(plan[0].changed).toBe(true)
    expect(plan[1].next).toEqual(["pp_system_default", PAYPAL_PROVIDER_ID])
    expect(plan[1].changed).toBe(false)
  })

  it("leaves archived and unrequested regions alone", () => {
    const archived = { ...region("reg_old", "usd"), countries: [] }
    expect(planPayPalRegions([region("reg_us", "usd"), archived, region("reg_ch", "chf")], ["usd"]).map(item => item.id)).toEqual(["reg_us"])
  })

  it("refuses unsupported, missing or unreadable region configuration before applying changes", () => {
    expect(() => planPayPalRegions([region("reg_us", "usd")], ["aed"])).toThrow(/supported PayPal currencies/)
    expect(() => planPayPalRegions([region("reg_us", "usd")], ["usd", "eur"])).toThrow(/active region/)
    expect(() => planPayPalRegions([{ ...region("reg_us", "usd"), payment_providers: undefined }], ["usd"])).toThrow(/existing payment methods/)
  })
})
