/** Volume and peptide names come from the supplied photos; concentration and full formula remain unconfirmed. */
export const NASAL_SPRAY_RESEARCH_DATE = "2026-10-13"
export const NASAL_SPRAYS = [
  {
    title: "Selank Nasal Spray",
    peptide: "Selank",
    handle: "selank",
    code: "VTD-SELANK",
    accent: "#287f75",
    usd: 89,
    researchContext:
      "Selank is a synthetic peptide, a short chain of amino acids, studied for stress-related signaling and communication between nerve cells.",
    literature: "https://pubmed.ncbi.nlm.nih.gov/26924987/",
    priceSources: [
      "https://www.elitepharmusa.com/shop/selank-nasal-spray-10mg",
      "https://cenexalabs.com/product/peptides/selank-peptide-spray-10ml/",
      "https://www.aminoresearchco.com/shop/product/selank",
    ],
  },
  {
    title: "Semax Nasal Spray",
    peptide: "Semax",
    handle: "semax",
    code: "VTD-SEMAX",
    accent: "#23618a",
    usd: 89,
    researchContext:
      "Semax is a synthetic peptide, a short chain of amino acids, studied for nerve-cell signaling and proteins involved in nerve-cell growth and maintenance.",
    literature: "https://pubmed.ncbi.nlm.nih.gov/19662538/",
    priceSources: [
      "https://www.elitepharmusa.com/shop/selank-nasal-spray-10mg",
      "https://www.aminoresearchco.com/shop/product/semax",
    ],
  },
].map((product) => {
  const ingredients = `${product.peptide} peptide (named on the label). The liquid carrier, preservatives and any other ingredients await manufacturer confirmation.`
  return {
    ...product,
    subtitle: "10 ml peptide spray · for laboratory research",
    description:
      `VETUD ${product.peptide} is presented in a 10 ml nasal spray bottle with its matching box. ` +
      `${product.researchContext} 99% purity. Tested in UK lab. ` +
      "The 10 ml label describes the amount of liquid in the bottle, not the amount of peptide. " +
      `Ingredient information: ${ingredients} The peptide concentration and total peptide content are not yet confirmed. ` +
      "Supplied for laboratory research only; not for human or veterinary use.",
    images: [
      `vetud_${product.handle}_alpine_01.png`,
      `vetud_${product.handle}_alpine_02.png`,
    ],
    metadata: {
      code: product.code,
      accent: product.accent,
      brand: "VETUD",
      form: "Nasal spray solution",
      volume: "10 ml",
      concentration: "Awaiting manufacturer confirmation",
      ingredients,
      named_peptide: product.peptide,
      formulation_status: "Awaiting full ingredient list and peptide strength",
      purity: "99%",
      testing: "Tested in UK lab",
      image_aspect_ratio: "4 / 5",
      storage: "Awaiting manufacturer storage instructions",
      lots: "",
      research_use_only: true,
      research_sources: product.literature,
      us_pricing_researched_at: NASAL_SPRAY_RESEARCH_DATE,
      us_pricing_sources: product.priceSources.join("; "),
      us_pricing_provisional: true,
      us_pricing_note:
        "Provisional USD price per 10 ml bottle, benchmarked against US spray listings. Reassess when total peptide content and formula are confirmed; bottle volume alone does not establish equivalent strength.",
    },
  }
})
