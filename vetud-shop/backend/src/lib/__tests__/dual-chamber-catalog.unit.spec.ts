import { boxSku, DUAL_CHAMBER_PRODUCTS, FORMATS, PEN_KIT_BOX, variantSku, type FormatKey } from "../../seed/dual-chamber-catalog"

const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[]

describe("dual-chamber catalog", () => {
  it("lists the 28 products once each", () => {
    const handles = DUAL_CHAMBER_PRODUCTS.map((product) => product.handle)
    expect(handles).toHaveLength(28)
    expect(new Set(handles).size).toBe(28)
    expect(new Set(DUAL_CHAMBER_PRODUCTS.map((product) => product.code)).size).toBe(28)
  })

  it("sells every product as a pen and a vial, the pen dearer than the vial", () => {
    for (const product of DUAL_CHAMBER_PRODUCTS) {
      for (const format of FORMAT_KEYS) {
        expect(product[format].length).toBeGreaterThan(0)
        for (const offer of product[format]) {
          expect(offer.usd).toBeGreaterThan(0)
        }
      }
      for (const pen of product.pen) {
        const vial = product.vial.find((offer) => offer.amount === pen.amount)
        if (vial) expect(pen.usd).toBeGreaterThan(vial.usd)
      }
    }
  })

  it("gives every variant its own SKU", () => {
    const skus = DUAL_CHAMBER_PRODUCTS.flatMap((product) => FORMAT_KEYS.flatMap((format) => product[format].map((offer) => variantSku(product, format, offer.amount))))
    expect(new Set(skus).size).toBe(skus.length)
    expect(variantSku(DUAL_CHAMBER_PRODUCTS.find((product) => product.handle === "bpc-157")!, "pen", "10 mg")).toBe("VTD-BPC-PEN-10MG")
    expect(variantSku(DUAL_CHAMBER_PRODUCTS.find((product) => product.handle === "igf-1-lr3")!, "vial", "0.1 mg")).toBe("VTD-IGF-VIAL-0_1MG")
  })

  it("prices every pen kit box above its pen, with SKUs of its own", () => {
    const boxed = DUAL_CHAMBER_PRODUCTS.filter((product) => !(PEN_KIT_BOX.excluded as readonly string[]).includes(product.handle))
    expect(boxed).toHaveLength(27)
    const skus = DUAL_CHAMBER_PRODUCTS.flatMap((product) => FORMAT_KEYS.flatMap((format) => product[format].map((offer) => variantSku(product, format, offer.amount))))
    const boxSkus = boxed.flatMap((product) => product.pen.map((offer) => boxSku(product, offer.amount)))
    expect(new Set([...skus, ...boxSkus]).size).toBe(skus.length + boxSkus.length)
    expect(boxSku(boxed.find((product) => product.handle === "bpc-157")!, "10 mg")).toBe("VTD-BPC-BOX-10MG")
    expect(PEN_KIT_BOX.premium).toBeGreaterThan(0)
  })

  it("keeps doses and use instructions out of the copy", () => {
    for (const product of DUAL_CHAMBER_PRODUCTS) {
      expect(`${product.summary} ${product.description}`).not.toMatch(/\b(dose|dosage|dosing|inject|per day|daily|weekly|protocol|cycle)\b/i)
      expect(product.description).toMatch(/laboratory research use only/)
    }
  })
})
