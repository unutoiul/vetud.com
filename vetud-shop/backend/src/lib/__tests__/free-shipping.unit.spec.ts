import { freeShippingThresholds, roundThreshold } from "../free-shipping"

describe("free shipping thresholds", () => {
  it("rounds converted amounts to round local numbers", () => {
    expect(roundThreshold(214.6)).toBe(215)
    expect(roundThreshold(2)).toBe(5)
    expect(roundThreshold(1_097)).toBe(1_100)
    expect(roundThreshold(84_210)).toBe(84_000)
    expect(roundThreshold(0)).toBeNull()
    expect(roundThreshold(Number.NaN)).toBeNull()
  })

  it("keeps the dollar amount as set and converts the others", () => {
    expect(freeShippingThresholds(250, ["USD", "eur", "gbp", "huf"], { eur: 0.86, gbp: 0.76, huf: 336.8 })).toEqual({ usd: 250, eur: 215, gbp: 190, huf: 84_000 })
  })

  it("leaves out a currency with no exchange rate", () => {
    expect(freeShippingThresholds(200, ["usd", "xyz"], {})).toEqual({ usd: 200 })
  })
})
