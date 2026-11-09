import { catalogFormatAllowed, isUnverifiedInjectionFormat, optionalVialAccessoriesAllowed, reviewedResearchDescription } from "../product-format-review"

describe("research product format review", () => {
  it("limits optional vial accessories to the reviewed peptide-powder catalog", () => {
    for (const handle of ["bpc-157", "semaglutide", "selank", "semax", "wolverine-blend"]) expect(optionalVialAccessoriesAllowed(handle)).toBe(true)
    for (const handle of ["decapeptide-12", "ghk-cu", "glow-blend", "klow-blend", "5-amino-1mq", "nad-plus", "bacteriostatic-water", "u-100-syringes", "anua-azelaic-acid-10-hyaluron-serum", "new-research-product"]) expect(optionalVialAccessoriesAllowed(handle)).toBe(false)
  })
  it("keeps the original catalog formats and limits the exclusion to Decapeptide-12", () => {
    for (const handle of ["retatrutide", "semaglutide", "bpc-157", "ghk-cu"]) {
      expect(catalogFormatAllowed(handle, "Pen kit box")).toBe(true)
      expect(catalogFormatAllowed(handle, "Dual-chamber vial")).toBe(true)
      expect(catalogFormatAllowed(handle, "Vial")).toBe(true)
    }
    expect(catalogFormatAllowed("decapeptide-12", "Pen kit box")).toBe(false)
    expect(catalogFormatAllowed("decapeptide-12", "Dual-chamber vial")).toBe(false)
    expect(catalogFormatAllowed("decapeptide-12", "Vial")).toBe(true)
    expect(catalogFormatAllowed("bacteriostatic-water", "Pen kit box")).toBe(false)
    expect(catalogFormatAllowed("selank", "Pen kit box")).toBe(false)
    expect(catalogFormatAllowed("selank", "Nasal spray")).toBe(true)
    expect(catalogFormatAllowed("semax", "Nasal spray")).toBe(true)
    expect(catalogFormatAllowed("decapeptide-12", "Nasal spray")).toBe(false)
  })

  it("recognizes retired format aliases without removing research vials", () => {
    for (const format of ["Dual-chamber pen", "Dual chamber vial", "Pen kit box"]) expect(isUnverifiedInjectionFormat(format)).toBe(true)
    for (const format of ["Vial", "Nasal spray", "Box of 10"]) expect(isUnverifiedInjectionFormat(format)).toBe(false)
  })

  it("removes inherited cartridge copy and remains stable on subsequent review", () => {
    const original = "A research compound.\n\nChoose a dual-chamber pen, with the powder and bacteriostatic water kept in separate chambers of one cartridge, or a vial of freeze-dried powder. Supplied for laboratory research use only. Not for human or veterinary use."
    const reviewed = reviewedResearchDescription("decapeptide-12", original)
    expect(reviewed).toContain("laboratory evaluation of topical formulations")
    expect(reviewed).toContain("not for injection")
    expect(reviewed).not.toContain("bacteriostatic water")
    expect(reviewed).not.toContain("Choose a dual-chamber")
    expect(reviewedResearchDescription("decapeptide-12", reviewed)).toBe(reviewed)
    const standard = reviewedResearchDescription("bpc-157", original)
    expect(reviewedResearchDescription("bpc-157", standard)).toBe(standard)
    const water = reviewedResearchDescription("bacteriostatic-water", "Water.\n\nChoose a dual-chamber cartridge of water for the VETUD pen, or a multi-use vial.")
    expect(water).toContain("Choose a dual-chamber")
    expect(reviewedResearchDescription("bacteriostatic-water", water)).toBe(water)
  })
})
