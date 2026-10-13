/** Product details transcribed from the supplied packaging, without placeholder prices or lots. */
import {
  penDescription,
  penIngredients,
  PEN_FEATURES,
  PEN_FORM,
  PEN_STABILITY_GUIDANCE,
  PRODUCT_HANDLING_GUIDANCE,
  PRODUCT_STORAGE_GUIDANCE,
  PRODUCT_TESTING_LABEL,
} from "./product-care"
export const RESEARCH_PEN_KIT_REVISION = "40mg-pen-kits-v1"

export const RESEARCH_PEN_KITS = [
  {
    title: "Retatrutide",
    handle: "retatrutide",
    code: "VTD-01",
    accent: "#23618a",
  },
  {
    title: "Semaglutide",
    handle: "semaglutide",
    code: "VTD-SEMA",
    accent: "#6f86c9",
  },
  {
    title: "Tirzepatide",
    handle: "tirzepatide",
    code: "VTD-TIRZ",
    accent: "#287f75",
  },
].map((product) => ({
  ...product,
  subtitle: "Freeze-dried peptide · dual-chamber pen · 10 mg / 20 mg / 40 mg",
  description: penDescription(product.title),
  images: [
    `vetud_${product.handle}_40mg_closed_lab.png`,
    `vetud_${product.handle}_40mg_open_lab.png`,
  ],
  metadata: {
    code: product.code,
    accent: product.accent,
    purity: "99%",
    testing: PRODUCT_TESTING_LABEL,
    image_aspect_ratio: "4 / 3",
    form: PEN_FORM,
    features: PEN_FEATURES,
    ingredients: penIngredients(product.title),
    storage: PRODUCT_STORAGE_GUIDANCE,
    stability: PEN_STABILITY_GUIDANCE,
    handling: PRODUCT_HANDLING_GUIDANCE,
    lots: "",
    brand: "VETUD",
    research_use_only: true,
    contents: "1 × 40 mg pen; 12 disposable needles; 1 instruction booklet",
    catalog_revision: RESEARCH_PEN_KIT_REVISION,
  },
}))
