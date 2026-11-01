import type { MedusaContainer } from "@medusajs/framework/types"
import { getActiveOffer, isValidUnsubscribeToken, unsubscribeToken } from "../newsletter"

describe("unsubscribe tokens", () => {
  const previous = process.env.JWT_SECRET
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret"
  })
  afterAll(() => {
    // Assigning undefined would store the string "undefined".
    if (previous === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previous
  })

  it("accepts the token from the email, whatever the address casing", () => {
    expect(isValidUnsubscribeToken("Ana@Example.com", unsubscribeToken("ana@example.com"))).toBe(true)
  })

  it("rejects a token made for another address, or a malformed one", () => {
    expect(isValidUnsubscribeToken("ana@example.com", unsubscribeToken("bob@example.com"))).toBe(false)
    expect(isValidUnsubscribeToken("ana@example.com", "short")).toBe(false)
  })
})

describe("getActiveOffer", () => {
  const day = 24 * 60 * 60 * 1000
  const at = (offset: number) => new Date(Date.now() + offset).toISOString()
  const campaign = (identifier: string, starts: number, ends: number) => ({
    name: identifier, description: null, campaign_identifier: identifier, starts_at: at(starts), ends_at: at(ends),
  })
  const percent = { type: "percentage", value: 15, currency_code: null }
  const containerWith = (rows: unknown[]) =>
    ({ resolve: () => ({ graph: async () => ({ data: rows }) }) }) as unknown as MedusaContainer

  it("picks the running pop-up campaign that ends soonest", async () => {
    const offer = await getActiveOffer(containerWith([
      { id: "promo_later", code: "LATER", is_automatic: false, application_method: percent, campaign: campaign("popup-later", -day, 9 * day) },
      { id: "promo_soon", code: "SOON", is_automatic: false, application_method: { type: "fixed", value: 20, currency_code: "eur" }, campaign: campaign("popup-soon", -day, 2 * day) },
    ]))
    expect(offer).toMatchObject({ promotion_id: "promo_soon", code: "SOON", discount: "20 EUR" })
  })

  it("ignores automatic, code-less, non-pop-up, ended and future promotions", async () => {
    const offer = await getActiveOffer(containerWith([
      { id: "auto", code: "AUTO", is_automatic: true, application_method: percent, campaign: campaign("popup-a", -day, day) },
      { id: "nocode", code: null, is_automatic: false, application_method: percent, campaign: campaign("popup-b", -day, day) },
      { id: "other", code: "OTHER", is_automatic: false, application_method: percent, campaign: campaign("summer", -day, day) },
      { id: "ended", code: "ENDED", is_automatic: false, application_method: percent, campaign: campaign("popup-c", -2 * day, -day) },
      { id: "future", code: "FUTURE", is_automatic: false, application_method: percent, campaign: campaign("popup-d", day, 2 * day) },
    ]))
    expect(offer).toBeNull()
  })
})
