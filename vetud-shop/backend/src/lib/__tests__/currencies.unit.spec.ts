import { currencyDigits, formatCurrency, roundMoney } from "../currencies"

describe("currency helpers", () => {
  it("takes each currency's decimals from Intl", () => {
    expect(currencyDigits("usd")).toBe(2)
    expect(currencyDigits("EUR")).toBe(2)
    expect(currencyDigits("jpy")).toBe(0)
    expect(currencyDigits("isk")).toBe(0)
  })

  it("rounds converted amounts to the smallest unit", () => {
    expect(roundMoney(98 * 0.89036459, "eur")).toBe(87.26)
    expect(roundMoney(58 * 157.94915504, "jpy")).toBe(9161)
    expect(roundMoney(68.6, "usd")).toBe(68.6)
  })

  it("formats amounts with Intl", () => {
    expect(formatCurrency(48, "eur")).toBe("€48.00")
    expect(formatCurrency(8515, "jpy")).toBe("¥8,515")
  })
})
