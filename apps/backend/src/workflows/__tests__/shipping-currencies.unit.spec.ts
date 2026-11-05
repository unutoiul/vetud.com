import { createStep } from "@medusajs/framework/workflows-sdk"
import { getExchangeRates } from "../../lib/currencies"
import "../sync-currency-prices"

jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createStep: jest.fn((_name, handler) => handler),
  createWorkflow: jest.fn(() => ({})),
  StepResponse: class { constructor(public data: unknown) {} },
  WorkflowResponse: class {},
}))
jest.mock("../../lib/currencies", () => ({
  BASE_CURRENCY: "usd",
  getExchangeRates: jest.fn(),
  roundMoney: (amount: number) => Math.round(amount * 100) / 100,
}))

describe("shipping currency coverage", () => {
  it("prices both destination zones in GBP and EUR without changing product or promotional prices", async () => {
    jest.mocked(getExchangeRates).mockResolvedValue({ usd: 1, eur: 0.9, gbp: 0.8 })
    const graph = jest.fn(async ({ entity }: { entity: string }) => {
      if (entity === "store") return { data: [{ supported_currencies: ["usd", "eur", "gbp"].map(currency_code => ({ currency_code })) }] }
      if (entity === "shipping_option_price_set") return { data: [{ shipping_option_id: "so_us", price_set_id: "ps_us" }, { shipping_option_id: "so_eu", price_set_id: "ps_eu" }] }
      if (entity === "shipping_option") return { data: [{ id: "so_us", type: { code: "standard" } }, { id: "so_eu", type: { code: "standard" } }] }
      throw new Error(`Unexpected pricing scope: ${entity}`)
    })
    const pricing = {
      listPrices: jest.fn(async () => [
        { id: "p_us_usd", price_set_id: "ps_us", currency_code: "usd", amount: 25 },
        { id: "p_eu_usd", price_set_id: "ps_eu", currency_code: "usd", amount: 25 },
        { id: "p_eu_eur", price_set_id: "ps_eu", currency_code: "eur", amount: 22.5 },
        { id: "p_promotion", price_set_id: "ps_us", currency_code: "gbp", amount: 0, rules_count: 1 },
      ]),
      addPrices: jest.fn(), updatePrices: jest.fn(), removePrices: jest.fn(),
    }
    const container = { resolve: (key: string) => key === "query" ? { graph } : pricing }
    const handler = jest.mocked(createStep).mock.calls.find(([name]) => name === "sync-currency-prices")![1] as unknown as (input: object, context: object) => Promise<unknown>
    await handler({ scope: "shipping" }, { container })
    expect(pricing.listPrices).toHaveBeenCalledWith({ price_set_id: ["ps_us", "ps_eu"] }, { take: null })
    expect(pricing.addPrices).toHaveBeenCalledWith([
      { priceSetId: "ps_us", prices: [{ currency_code: "eur", amount: 22.5 }, { currency_code: "gbp", amount: 20 }] },
      { priceSetId: "ps_eu", prices: [{ currency_code: "gbp", amount: 20 }] },
    ])
    expect(pricing.updatePrices).not.toHaveBeenCalled()
    expect(pricing.removePrices).not.toHaveBeenCalled()
  })
})
