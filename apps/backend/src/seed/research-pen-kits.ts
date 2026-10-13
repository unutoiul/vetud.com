/** Product details transcribed from the supplied packaging, without placeholder prices or lots. */
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
  subtitle: "Research peptide · 40 mg pen kit",
  description:
    `VETUD ${product.title} 40 mg pen kit. The packaging lists one 40 mg pen, ` +
    "12 disposable needles and one instruction booklet. Labeled for research use only. " +
    "99% purity. Tested in UK lab.",
  images: [
    `vetud_${product.handle}_40mg_closed.png`,
    `vetud_${product.handle}_40mg_open.png`,
  ],
  metadata: {
    code: product.code,
    accent: product.accent,
    purity: "99%",
    testing: "Tested in UK lab",
    image_aspect_ratio: "4 / 3",
    form: "40 mg pen kit",
    storage: "",
    lots: "",
    brand: "VETUD",
    research_use_only: true,
    contents: "1 × 40 mg pen; 12 disposable needles; 1 instruction booklet",
    catalog_revision: RESEARCH_PEN_KIT_REVISION,
  },
}))
