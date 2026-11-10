import { PRODUCT_IMAGE_ORIGIN } from "../lib/product-image-origin"
/** Label facts from the owner's supplied photographs; retail amounts were approved with each publication. */
export const SUPPLIED_RESEARCH_PRODUCTS = [
  {
    title: "NAD+",
    handle: "nad-plus",
    code: "VTD-NAD",
    amount: "1000 mg",
    sku: "VTD-NAD-1000MG",
    categoryHandles: ["longevity-anti-aging-research"],
    subtitle: "NAD+ research pen kit · 1000 mg",
    description: "VETUD NAD+ research pen kit, labelled with 1000 mg total content. NAD+ (nicotinamide adenine dinucleotide) is a coenzyme investigated in cellular redox metabolism and ageing-related biology. It is not a peptide. The supplied packaging shows one pen, 12 disposable needles and an instruction booklet.\n\nThe labelled amount is the total kit amount, not a per-use quantity. Formulation, purity, concentration, batch documentation and storage conditions require manufacturer confirmation. For laboratory research use only.",
    usd: 298,
    researchSource: "https://pubmed.ncbi.nlm.nih.gov/37848251/",
  },
  {
    title: "Melanotan",
    handle: "melanotan",
    code: "VTD-MEL",
    amount: "10 mg",
    sku: "VTD-MEL-10MG",
    categoryHandles: ["peptide-series", "beauty"],
    subtitle: "Melanotan research pen kit · 10 mg · subtype unspecified",
    description: "VETUD Melanotan research pen kit, labelled with 10 mg total content. Categorised under Beauty for pigmentation-related research. The owner has retained the unspecified Melanotan label; this record does not identify the material as Melanotan I or Melanotan II. The supplied packaging shows one pen, 12 disposable needles and an instruction booklet.\n\nThe labelled amount is the total kit amount, not a per-use quantity. Exact molecular identity, formulation, purity, concentration, batch documentation and storage conditions require manufacturer confirmation. For laboratory research use only.",
    usd: 98,
    researchSource: "",
  },
  {
    title: "Ipamorelin",
    handle: "ipamorelin",
    code: "VTD-IPA",
    amount: "5 mg",
    sku: "VTD-IPA-5MG",
    categoryHandles: ["peptide-series", "muscle-growth-research"],
    subtitle: "Ipamorelin research pen kit · 5 mg",
    description: "VETUD Ipamorelin research pen kit, labelled with 5 mg total content. Ipamorelin is a peptide investigated as a growth-hormone secretagogue. The Muscle Growth Research category describes a research area and does not establish a muscle-growth outcome for this product. The supplied packaging shows one pen, 12 disposable needles and an instruction booklet.\n\nThe labelled amount is the total kit amount, not a per-use quantity. Formulation, purity, concentration, batch documentation and storage conditions require manufacturer confirmation. For laboratory research use only.",
    usd: 98,
    researchSource: "https://pubmed.ncbi.nlm.nih.gov/9849822/",
  },
  {
    // Added 2026-11-02 from the owner's two Tesamorelin photographs; price chosen by the owner.
    title: "Tesamorelin",
    handle: "tesamorelin",
    code: "VTD-TES",
    amount: "20 mg",
    sku: "VTD-TES-20MG",
    categoryHandles: ["peptide-series", "muscle-growth-research"],
    subtitle: "Tesamorelin research pen kit · 20 mg",
    description: "VETUD Tesamorelin research pen kit, labelled with 20 mg total content. Tesamorelin is a peptide analogue of growth-hormone-releasing hormone (GHRH) investigated in growth hormone and visceral fat research. The Muscle Growth Research category describes a research area and does not establish an outcome for this product. The supplied packaging shows one pen, 12 disposable needles and an instruction booklet.\n\nThe labelled amount is the total kit amount, not a per-use quantity. Formulation, purity, concentration, batch documentation and storage conditions require manufacturer confirmation. For laboratory research use only.",
    usd: 198,
    researchSource: "https://pubmed.ncbi.nlm.nih.gov/18057338/",
  },
] as const

export const SUPPLIED_PRODUCTS_REVISION = "supplied-three-pen-kits-2026-10-30-v1"
export { PRODUCT_IMAGE_ORIGIN }
