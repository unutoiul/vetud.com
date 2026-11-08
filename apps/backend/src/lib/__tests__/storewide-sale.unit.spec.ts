import { isSaleExcluded, planSalePrices, readSaleSettings, saleAmount, saleState, SALE_METADATA_KEY, type VariantPrices } from "../storewide-sale"

const regular = (id: string, currency: string, amount: number) => ({ id, currency_code: currency, amount, price_list_id: null, min_quantity: null, max_quantity: null, rules_count: 0 })
const listed = (id: string, currency: string, amount: number, list = "plist_sale") => ({ ...regular(id, currency, amount), price_list_id: list })

describe("storewide sale", () => {
  it("takes the percentage off, to the cent or to the unit like the regular prices", () => {
    expect(saleAmount(98, 30, "usd")).toBe(68.6)
    expect(saleAmount(338, 30, "usd")).toBe(236.6)
    expect(saleAmount(88, 30, "EUR")).toBe(61.6)
    expect(saleAmount(14462, 30, "jpy")).toBe(10123)
    expect(saleAmount(19.99, 25, "usd")).toBe(14.99)
  })

  it("leaves products marked sale_excluded at full price, removing sale prices they already had", () => {
    expect(isSaleExcluded({ sale_excluded: true })).toBe(true)
    expect(isSaleExcluded({ sale_excluded: "true" })).toBe(false)
    expect(isSaleExcluded(null)).toBe(false)
    const variants: VariantPrices[] = [
      { id: "variant_serum", excluded: true, price_set: { prices: [regular("p1", "usd", 25), listed("s1", "usd", 17.5)] } },
      { id: "variant_peptide", price_set: { prices: [regular("p2", "usd", 100)] } },
    ]
    expect(planSalePrices(variants, "plist_sale", 30)).toEqual({
      create: [{ variant_id: "variant_peptide", currency_code: "usd", amount: 70 }],
      update: [],
      delete: ["s1"],
    })
  })

  it("creates one sale price per variant and currency for a new sale", () => {
    const variants: VariantPrices[] = [
      { id: "variant_a", price_set: { prices: [regular("p1", "usd", 98), regular("p2", "eur", 88)] } },
      { id: "variant_b", price_set: { prices: [regular("p3", "usd", 68)] } },
    ]
    expect(planSalePrices(variants, null, 30)).toEqual({
      create: [
        { variant_id: "variant_a", currency_code: "usd", amount: 68.6 },
        { variant_id: "variant_a", currency_code: "eur", amount: 61.6 },
        { variant_id: "variant_b", currency_code: "usd", amount: 47.6 },
      ],
      update: [],
      delete: [],
    })
  })

  it("ignores other price lists and prices with region or quantity rules", () => {
    const variants: VariantPrices[] = [{
      id: "variant_a",
      price_set: { prices: [
        { ...regular("p1", "usd", 500), rules_count: 1 },
        { ...regular("p2", "usd", 400), min_quantity: 10 },
        listed("p3", "usd", 50, "plist_other"),
        regular("p4", "usd", 100),
      ] },
    }]
    expect(planSalePrices(variants, "plist_sale", 30).create).toEqual([{ variant_id: "variant_a", currency_code: "usd", amount: 70 }])
  })

  it("updates changed prices, keeps correct ones and removes duplicates and dropped currencies", () => {
    const variants: VariantPrices[] = [{
      id: "variant_a",
      price_set: { prices: [
        regular("p1", "usd", 100),
        regular("p2", "eur", 90),
        listed("s1", "usd", 80),
        listed("s2", "eur", 63),
        listed("s3", "eur", 63),
        listed("s4", "gbp", 50),
      ] },
    }]
    expect(planSalePrices(variants, "plist_sale", 30)).toEqual({
      create: [],
      update: [{ id: "s1", variant_id: "variant_a", currency_code: "usd", amount: 70 }],
      delete: ["s3", "s4"],
    })
  })

  it("reads the percentage only from price lists the Sales page manages", () => {
    expect(readSaleSettings({ [SALE_METADATA_KEY]: { percent_off: 30 } })).toEqual({ percent_off: 30 })
    expect(readSaleSettings({ other: true })).toBeNull()
    expect(readSaleSettings(null)).toBeNull()
  })

  it("tells live, scheduled, ended and switched-off sales apart", () => {
    const now = new Date("2026-12-10T12:00:00Z")
    expect(saleState({ status: "active" }, now)).toBe("live")
    expect(saleState({ status: "active", starts_at: "2026-12-20T00:00:00Z" }, now)).toBe("scheduled")
    expect(saleState({ status: "active", ends_at: "2026-12-01T00:00:00Z" }, now)).toBe("ended")
    expect(saleState({ status: "draft", starts_at: "2026-12-01T00:00:00Z" }, now)).toBe("off")
  })
})
