import { restoredFormatMetadata, restoredPackagingDescription, variantPriceDigest, type RestoreProduct } from "../product-format-restore"

describe("original catalog format restoration", () => {
  it("restores packaging without erasing later copy or accessory settings", () => {
    const source: RestoreProduct = { id: "p", handle: "retatrutide", description: "Original compound copy.\n\nChoose a dual-chamber pen or a vial.", thumbnail: "pen.webp", images: [], variants: [], formats: ["Pen kit box", "Dual-chamber vial", "Vial"], metadata: { form: "Original formats", contents_box: "Original box" } }
    const current = "Updated compound copy.\n\nSupplied as sealed research material in a glass vial. No diluent, pen or needles are included."
    const restored = restoredPackagingDescription(current, source.description)
    expect(restored).toBe("Updated compound copy.\n\nChoose a dual-chamber pen or a vial.")
    expect(restoredPackagingDescription(restored, source.description)).toBe(restored)
    const metadata = restoredFormatMetadata({ preparation_addons_allowed: true, testing: "New lot testing", injection_format_verified: false }, source)
    expect(metadata.preparation_addons_allowed).toBe(true)
    expect(metadata.testing).toBe("New lot testing")
    expect(metadata.injection_format_verified).toBe(false)
    expect(metadata.contents_box).toBe("Original box")
  })

  it("compares original price records independently of row ordering", () => {
    const first = { id: "p1", currency_code: "usd", amount: 77, price_list_id: null }
    const second = { id: "p2", currency_code: "eur", amount: 69.06, price_list_id: null }
    const variant = { id: "v", price_set: { id: "ps", prices: [first, second] } }
    expect(variantPriceDigest(variant)).toBe(variantPriceDigest({ ...variant, price_set: { id: "ps", prices: [second, first] } }))
    expect(variantPriceDigest(variant)).not.toBe(variantPriceDigest({ ...variant, price_set: { id: "ps", prices: [{ ...first, amount: 78 }, second] } }))
  })
})
