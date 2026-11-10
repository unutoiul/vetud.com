/**
 * The dual-chamber catalog approved by the owner on 2026-11-04 (28 products; Decapeptide-12 added
 * 2026-11-09), each sold as a
 * dual-chamber pen and as a vial at its own price. Artwork lives in the storefront at
 * /images/products/<handle>-pen.webp and <handle>-vial.webp (scripts/prepare-dual-chamber-images.mjs).
 */
import { RESEARCH_WATER_SUBTITLE, reviewedResearchDescription } from "../lib/product-format-review"

export const DUAL_CHAMBER_REVISION = "dual-chamber-2026-11-04-v1"
export const DUAL_CHAMBER_IMAGE_ORIGIN = process.env.DUAL_CHAMBER_IMAGE_ORIGIN || "https://www.vetud.com"

export const FORMATS = {
  // Called "Dual-chamber pen" until 2026-11-04; the reusable pen now comes in the Pen kit box.
  pen: "Dual-chamber vial",
  vial: "Vial",
} as const
export type FormatKey = keyof typeof FORMATS

export const FORMAT_CONTENTS: Record<FormatKey, string> = {
  // Since 2026-11-04 the reusable pen, needles and booklet come with the Pen kit box (see PEN_KIT_BOX).
  pen: "1 dual-chamber vial: a cartridge with the lyophilized peptide in one chamber and bacteriostatic water in the other. It fits the reusable VETUD pen from the pen kit box.",
  vial: "1 sealed glass vial of lyophilized (freeze-dried) peptide. Bacteriostatic water is sold separately.",
}

/** One amount in one format at its retail USD price; other currencies are converted from it. */
export type CatalogOffer = { amount: string; usd: number }

export type DualChamberProduct = {
  handle: string
  title: string
  code: string
  categories: string[]
  learn: string[]
  summary: string
  description: string
  pen: CatalogOffer[]
  vial: CatalogOffer[]
  contents?: Partial<Record<FormatKey, string>>
  /** Replaces the storefront's one-line format description on the format cards. */
  lines?: Partial<Record<FormatKey, string>>
}

const FORMAT_LINE = "Choose a dual-chamber pen, with the powder and bacteriostatic water kept in separate chambers of one cartridge, or a vial of freeze-dried powder."
const RUO = "Supplied for laboratory research use only. Not for human or veterinary use."
const describe = (about: string) => `${about}\n\n${FORMAT_LINE} ${RUO}`

const offer = (amount: string, usd: number): CatalogOffer => ({ amount, usd })

/**
 * Products whose subtitle and description were rewritten in plain language (2026-11-06, the pilot),
 * applied to existing databases by migration-scripts/vetud-product-24-plain-descriptions.ts.
 */
export const PLAIN_COPY = { revision: "plain-copy-2026-11-06-v1", handles: ["bpc-157", "semaglutide", "selank", "wolverine-blend"] } as const

export const DUAL_CHAMBER_PRODUCTS: DualChamberProduct[] = [
  {
    handle: "5-amino-1mq", title: "5-Amino-1MQ", code: "VTD-5AM",
    categories: ["longevity-anti-aging-research", "weight-loss-research"], learn: ["5-amino-1mq"],
    summary: "Small-molecule NNMT inhibitor studied in cell metabolism research.",
    description: describe("5-Amino-1MQ is a small molecule that blocks the enzyme NNMT. It is studied in fat-cell and energy-metabolism research, mostly in cells and animals. It is not a peptide."),
    pen: [offer("10 mg", 98), offer("50 mg", 198)],
    vial: [offer("10 mg", 68), offer("50 mg", 138)],
  },
  {
    handle: "aod-9604", title: "AOD-9604", code: "VTD-AOD",
    categories: ["weight-loss-research"], learn: ["aod-9604"],
    summary: "Fragment of human growth hormone studied in fat-metabolism research.",
    description: describe("AOD-9604 is a modified fragment of the end of human growth hormone. It has been studied in fat-metabolism and cartilage research."),
    pen: [offer("5 mg", 98), offer("10 mg", 158)],
    vial: [offer("5 mg", 68), offer("10 mg", 108)],
  },
  {
    handle: "ara-290", title: "ARA-290", code: "VTD-ARA",
    categories: ["healing-regeneration-research"], learn: ["ara-290"],
    summary: "Erythropoietin-derived peptide studied in nerve and tissue-protection research.",
    description: describe("ARA-290 (cibinetide) is a small peptide modelled on part of erythropoietin. It is studied for its effects on the innate repair receptor in nerve and tissue-protection research."),
    pen: [offer("10 mg", 118), offer("20 mg", 198)],
    vial: [offer("10 mg", 78), offer("20 mg", 138)],
  },
  {
    handle: "bpc-157", title: "BPC-157", code: "VTD-BPC",
    categories: ["healing-regeneration-research"], learn: ["bpc-157"],
    summary: "Lab-made peptide based on a stomach protein, studied for tissue repair, mostly in animals.",
    description: describe("BPC-157 is a lab-made chain of 15 amino acids, based on a protein found in stomach juice. Researchers study it for the healing of tendons, muscles, bones and the gut. Almost all of that research is in animals."),
    pen: [offer("5 mg", 88), offer("10 mg", 138)],
    vial: [offer("5 mg", 58), offer("10 mg", 98)],
  },
  {
    handle: "cjc-1295-ipamorelin", title: "CJC-1295 + Ipamorelin (no DAC)", code: "VTD-CJI",
    categories: ["muscle-growth-research"], learn: ["cjc-1295", "ipamorelin"],
    summary: "Blend of a GHRH analogue and a ghrelin-receptor agonist for growth-hormone research.",
    description: describe("A blend of CJC-1295 without DAC (a growth-hormone-releasing hormone analogue) and Ipamorelin (a ghrelin-receptor agonist), labelled as equal parts. Both are studied in growth-hormone release research."),
    pen: [offer("10 mg (5 mg + 5 mg)", 148)],
    vial: [offer("10 mg (5 mg + 5 mg)", 98)],
  },
  {
    // Added 2026-11-09 (owner request): migration-scripts/vetud-product-25-decapeptide-12.ts.
    handle: "decapeptide-12", title: "Decapeptide-12", code: "VTD-D12",
    categories: ["beauty", "skin-copper-peptides"], learn: ["decapeptide-12"],
    summary: "Tyrosinase-blocking peptide studied in skin-pigmentation research.",
    description: describe("Decapeptide-12 is a lab-made chain of 10 amino acids that blocks tyrosinase, the enzyme that makes the skin pigment melanin. It is studied in skin-pigmentation research, mostly as an ingredient of skin creams."),
    pen: [offer("200 mg", 350)],
    vial: [offer("200 mg", 250)],
  },
  {
    handle: "dsip", title: "DSIP", code: "VTD-DSIP",
    categories: ["sleep-enhancement-research"], learn: ["dsip"],
    summary: "Delta sleep-inducing peptide, studied in sleep and stress research.",
    description: describe("DSIP (delta sleep-inducing peptide) is a nine-amino-acid peptide first isolated in the 1970s. It is studied in sleep-regulation and stress research, with mixed results."),
    pen: [offer("5 mg", 88), offer("10 mg", 138)],
    vial: [offer("5 mg", 58), offer("10 mg", 98)],
  },
  {
    handle: "ghk-cu", title: "GHK-Cu", code: "VTD-GHK",
    categories: ["skin-copper-peptides"], learn: ["ghk-cu"],
    summary: "Copper-binding tripeptide studied in skin and wound research.",
    description: describe("GHK-Cu is a small copper-binding peptide found naturally in human plasma. It is studied in skin, collagen and wound-healing research."),
    pen: [offer("50 mg", 88), offer("100 mg", 138)],
    vial: [offer("50 mg", 58), offer("100 mg", 98)],
  },
  {
    handle: "glow-blend", title: "GLOW Blend", code: "VTD-GLOW",
    categories: ["skin-copper-peptides", "healing-regeneration-research"], learn: ["ghk-cu", "bpc-157", "tb-500"],
    summary: "Blend of GHK-Cu, BPC-157 and TB-500 for skin and tissue research.",
    description: describe("GLOW is a research blend of GHK-Cu, BPC-157 and TB-500, labelled as 50 mg, 10 mg and 10 mg. Each is studied separately in skin and tissue-repair research; the blend itself has not been studied."),
    pen: [offer("70 mg", 228)],
    vial: [offer("70 mg", 148)],
  },
  {
    handle: "glutathione", title: "Glutathione", code: "VTD-GSH",
    categories: ["longevity-anti-aging-research"], learn: [],
    summary: "The body's main antioxidant tripeptide, studied in oxidative-stress research.",
    description: describe("Glutathione is a tripeptide made by every human cell and the body's main antioxidant. It is studied in oxidative-stress, liver and skin research."),
    pen: [offer("600 mg", 98), offer("1500 mg", 178)],
    vial: [offer("600 mg", 68), offer("1500 mg", 118)],
  },
  {
    handle: "bacteriostatic-water", title: "Bacteriostatic Water (H2O)", code: "VTD-H2O",
    categories: ["lab-supplies"], learn: [],
    summary: "Sterile water with 0.9% benzyl alcohol, for laboratory reconstitution.",
    description: `Bacteriostatic water is sterile water with 0.9% benzyl alcohol, which slows bacterial growth after the vial is opened. It is used in laboratories to reconstitute freeze-dried materials.\n\nChoose a dual-chamber cartridge of water for the VETUD pen, or a multi-use vial. ${RUO}`,
    pen: [offer("3 ml", 28)],
    vial: [offer("10 ml", 18), offer("30 ml", 38)],
    contents: {
      pen: "1 dual-chamber cartridge of bacteriostatic water for the VETUD pen",
      vial: "1 sealed multi-use glass vial of bacteriostatic water",
    },
    lines: {
      pen: "A cartridge of BAC water for the reusable VETUD pen",
      vial: "Multi-use vial, the lowest price per ml",
    },
  },
  {
    handle: "igf-1-lr3", title: "IGF-1 LR3", code: "VTD-IGF",
    categories: ["muscle-growth-research"], learn: ["igf-1-lr3"],
    summary: "Long-acting IGF-1 analogue used in cell-growth research.",
    description: describe("IGF-1 LR3 is a modified form of insulin-like growth factor 1 that binds less to its carrier proteins, so it stays active longer. It is mostly used in cell-culture growth research."),
    pen: [offer("0.1 mg", 98), offer("1 mg", 298)],
    vial: [offer("0.1 mg", 68), offer("1 mg", 198)],
  },
  {
    handle: "ipamorelin", title: "Ipamorelin", code: "VTD-IPA",
    categories: ["muscle-growth-research"], learn: ["ipamorelin"],
    summary: "Selective ghrelin-receptor agonist studied in growth-hormone research.",
    description: describe("Ipamorelin is a five-amino-acid peptide that activates the ghrelin receptor. It is studied as a selective growth-hormone secretagogue."),
    pen: [offer("5 mg", 98), offer("10 mg", 158)],
    vial: [offer("5 mg", 68), offer("10 mg", 108)],
  },
  {
    handle: "klow-blend", title: "KLOW Blend", code: "VTD-KLOW",
    categories: ["skin-copper-peptides", "healing-regeneration-research"], learn: ["ghk-cu", "bpc-157", "tb-500", "kpv"],
    summary: "Blend of GHK-Cu, BPC-157, TB-500 and KPV for skin and tissue research.",
    description: describe("KLOW is a research blend of GHK-Cu, BPC-157, TB-500 and KPV, labelled as 50 mg, 10 mg, 10 mg and 10 mg. Each is studied separately in skin, tissue-repair and inflammation research; the blend itself has not been studied."),
    pen: [offer("80 mg", 248)],
    vial: [offer("80 mg", 168)],
  },
  {
    handle: "kpv", title: "KPV", code: "VTD-KPV",
    categories: ["immunity-enhancement-research"], learn: ["kpv"],
    summary: "Alpha-MSH tripeptide studied in inflammation research.",
    description: describe("KPV is the last three amino acids of alpha-MSH. It is studied in gut and skin inflammation research, mostly in cells and animals."),
    pen: [offer("5 mg", 88), offer("10 mg", 138)],
    vial: [offer("5 mg", 58), offer("10 mg", 98)],
  },
  {
    handle: "mots-c", title: "MOTS-c", code: "VTD-MOTS",
    categories: ["longevity-anti-aging-research"], learn: ["mots-c"],
    summary: "Mitochondria-derived peptide studied in metabolism and ageing research.",
    description: describe("MOTS-c is a 16-amino-acid peptide encoded in mitochondrial DNA. It is studied in metabolism, exercise and ageing research, mostly in animals."),
    pen: [offer("10 mg", 118), offer("40 mg", 298)],
    vial: [offer("10 mg", 78), offer("40 mg", 198)],
  },
  {
    handle: "melanotan-ii", title: "Melanotan II (MT-2)", code: "VTD-MT2",
    categories: ["beauty"], learn: ["melanotan"],
    summary: "Synthetic melanocortin agonist studied in pigmentation research.",
    description: describe("Melanotan II is a synthetic analogue of alpha-MSH that activates several melanocortin receptors. It is studied in skin-pigmentation research."),
    pen: [offer("10 mg", 98)],
    vial: [offer("10 mg", 58)],
  },
  {
    handle: "melanotan-i", title: "Melanotan I (MT-1)", code: "VTD-MT1",
    categories: ["beauty"], learn: ["melanotan"],
    summary: "Alpha-MSH analogue (afamelanotide) studied in pigmentation research.",
    description: describe("Melanotan I (afamelanotide) is a synthetic analogue of alpha-MSH that mainly activates the MC1 receptor. It is studied in skin-pigmentation and light-sensitivity research."),
    pen: [offer("10 mg", 98)],
    vial: [offer("10 mg", 58)],
  },
  {
    handle: "nad-plus", title: "NAD+", code: "VTD-NAD",
    categories: ["longevity-anti-aging-research"], learn: ["nad"],
    summary: "Coenzyme studied in cellular energy and ageing research.",
    description: describe("NAD+ (nicotinamide adenine dinucleotide) is a coenzyme every cell uses to turn food into energy. Its levels fall with age, which makes it a focus of ageing research. It is not a peptide."),
    pen: [offer("500 mg", 198), offer("1000 mg", 298)],
    vial: [offer("500 mg", 128), offer("1000 mg", 198)],
  },
  {
    handle: "pt-141", title: "PT-141", code: "VTD-PT141",
    categories: ["reproductive-health-research"], learn: ["pt-141"],
    summary: "Melanocortin agonist (bremelanotide) studied in sexual-function research.",
    description: describe("PT-141 (bremelanotide) is a melanocortin-receptor agonist derived from Melanotan II. It is studied in sexual-desire research."),
    pen: [offer("10 mg", 98)],
    vial: [offer("10 mg", 58)],
  },
  {
    handle: "retatrutide", title: "Retatrutide", code: "VTD-RT",
    categories: ["weight-loss-research"], learn: ["retatrutide"],
    summary: "Triple GIP, GLP-1 and glucagon receptor agonist in clinical metabolic research.",
    description: describe("Retatrutide is an investigational peptide that activates three hormone receptors: GIP, GLP-1 and glucagon. It is in clinical trials for obesity and type 2 diabetes."),
    pen: [offer("10 mg", 298), offer("20 mg", 488), offer("40 mg", 688)],
    vial: [offer("10 mg", 198), offer("20 mg", 328), offer("40 mg", 468)],
  },
  {
    handle: "semaglutide", title: "Semaglutide (SM-1)", code: "VTD-SM1",
    categories: ["weight-loss-research"], learn: ["semaglutide"],
    summary: "Long-acting copy of the gut hormone GLP-1, studied in weight and diabetes research.",
    description: describe("Semaglutide, labelled SM-1, is a long-acting copy of GLP-1, a hormone the gut releases after a meal that signals fullness. It is one of the most studied peptides in obesity and type 2 diabetes research, including large trials in people."),
    pen: [offer("10 mg", 198), offer("20 mg", 338), offer("40 mg", 488)],
    vial: [offer("10 mg", 128), offer("20 mg", 228), offer("40 mg", 328)],
  },
  {
    handle: "ss-31", title: "SS-31", code: "VTD-SS31",
    categories: ["longevity-anti-aging-research"], learn: ["ss-31"],
    summary: "Mitochondria-targeted peptide (elamipretide) studied in energy research.",
    description: describe("SS-31 (elamipretide) is a small peptide that binds to the inner membrane of mitochondria. It is studied in mitochondrial disease and cellular-energy research."),
    pen: [offer("10 mg", 148), offer("50 mg", 398)],
    vial: [offer("10 mg", 98), offer("50 mg", 268)],
  },
  {
    handle: "selank", title: "Selank", code: "VTD-SEL",
    categories: ["sleep-enhancement-research"], learn: ["selank"],
    summary: "Lab-made peptide developed in Russia, studied for anxiety and stress.",
    description: describe("Selank is a lab-made chain of seven amino acids, based on tuftsin, a tiny piece of an immune protein. It was developed in Russia, where it is registered for anxiety, and is studied in small human studies and in animals."),
    pen: [offer("5 mg", 88), offer("10 mg", 138)],
    vial: [offer("5 mg", 58), offer("10 mg", 98)],
  },
  {
    handle: "semax", title: "Semax", code: "VTD-SMX",
    categories: ["cognitive-enhancement-research"], learn: ["semax"],
    summary: "ACTH-derived peptide studied in cognition and nerve research.",
    description: describe("Semax is a synthetic peptide based on a fragment of ACTH. It was developed in Russia and is studied in cognition, stroke and nerve-protection research."),
    pen: [offer("5 mg", 88), offer("10 mg", 138)],
    vial: [offer("5 mg", 58), offer("10 mg", 98)],
  },
  {
    handle: "tb-500", title: "TB-500", code: "VTD-TB5",
    categories: ["healing-regeneration-research"], learn: ["tb-500"],
    summary: "Thymosin beta-4 fragment studied in tissue-repair research.",
    description: describe("TB-500 is a synthetic peptide based on the active region of thymosin beta-4, a protein involved in cell movement. It is studied in wound and tissue-repair research, mostly in animals."),
    pen: [offer("5 mg", 98), offer("10 mg", 168)],
    vial: [offer("5 mg", 68), offer("10 mg", 118)],
  },
  {
    handle: "tirzepatide", title: "Tirzepatide (TZ-2)", code: "VTD-TZ2",
    categories: ["weight-loss-research"], learn: ["tirzepatide"],
    summary: "Dual GIP and GLP-1 receptor agonist studied in metabolic research.",
    description: describe("Tirzepatide, labelled TZ-2, is a peptide that activates two hormone receptors, GIP and GLP-1. It is studied in obesity and type 2 diabetes research."),
    pen: [offer("10 mg", 248), offer("20 mg", 398), offer("40 mg", 588)],
    vial: [offer("10 mg", 168), offer("20 mg", 268), offer("40 mg", 398)],
  },
  {
    handle: "tesamorelin", title: "Tesamorelin", code: "VTD-TES",
    categories: ["muscle-growth-research"], learn: ["tesamorelin"],
    summary: "GHRH analogue studied in growth-hormone and visceral-fat research.",
    description: describe("Tesamorelin is a stabilised analogue of growth-hormone-releasing hormone (GHRH). It is studied in growth-hormone and visceral-fat research."),
    pen: [offer("10 mg", 128), offer("20 mg", 198)],
    vial: [offer("10 mg", 88), offer("20 mg", 138)],
  },
  {
    handle: "wolverine-blend", title: "Wolverine Blend", code: "VTD-WOLV",
    categories: ["healing-regeneration-research"], learn: ["bpc-157", "tb-500"],
    summary: "Equal parts BPC-157 and TB-500, two peptides studied for tissue repair.",
    description: describe("Wolverine is a research blend of BPC-157 and TB-500 in equal parts. Each has been studied on its own for tissue repair, mostly in animals. No published study has tested the blend itself."),
    pen: [offer("10 mg (5 mg + 5 mg)", 148), offer("20 mg (10 mg + 10 mg)", 228)],
    vial: [offer("10 mg (5 mg + 5 mg)", 98), offer("20 mg (10 mg + 10 mg)", 158)],
  },
].map(product => ({ ...product, summary: product.handle === "bacteriostatic-water" ? RESEARCH_WATER_SUBTITLE : product.summary, description: reviewedResearchDescription(product.handle, product.description) }))

/** Earlier products on the same handles are kept as drafts under this suffix (e.g. retatrutide-pen-kit-2026). */
export const REPLACED_SUFFIX = "-pen-kit-2026"

/** The earlier Melanotan kit (subtype unspecified) is replaced by Melanotan I and II and goes back to draft. */
export const RETIRED_HANDLES = ["melanotan"]

export const imageUrl = (handle: string, view: FormatKey) => `${DUAL_CHAMBER_IMAGE_ORIGIN}/images/products/${handle}-${view}.webp`
export const EXPLAINER_IMAGE = () => `${DUAL_CHAMBER_IMAGE_ORIGIN}/images/products/dual-chamber-pen.webp`

/** VTD-BPC-PEN-10MG; blends keep only their total ("10 mg (5 mg + 5 mg)" → 10MG). */
export const variantSku = (product: DualChamberProduct, format: FormatKey, amount: string) =>
  `${product.code}-${format.toUpperCase()}-${amount.split("(")[0].replace(/\s+/g, "").replace(".", "_").toUpperCase()}`

export const variantTitle = (format: FormatKey, amount: string) => `${FORMATS[format]} · ${amount}`

/**
 * The Pen kit box, added on 2026-11-04 as a third format: the reusable pen with a dual-chamber vial,
 * in the VETUD box. It's offered in every amount the dual-chamber vial is, at its price plus this premium.
 * Bacteriostatic water has no kit.
 */
export const PEN_KIT_BOX = {
  title: "Pen kit box",
  revision: "pen-kit-box-2026-11-04-v1",
  /** Added to the dual-chamber vial's USD price. */
  premium: 40,
  excluded: ["bacteriostatic-water"],
  contents: "VETUD box with the reusable pen body, 1 dual-chamber vial (lyophilized peptide in one chamber, bacteriostatic water in the other), 12 disposable needles and an instruction booklet",
} as const

export const boxSku = (product: DualChamberProduct, amount: string) => variantSku(product, "pen", amount).replace("-PEN-", "-BOX-")

/**
 * Selank and Semax (owner's request, 2026-11-05): their boxed format is the 10 ml nasal spray in its
 * VETUD box, not the pen kit box. Same amounts, prices and SKUs as the pen kit box it replaces.
 */
export const NASAL_SPRAY = {
  title: "Nasal spray",
  revision: "nasal-spray-format-2026-11-05-v1",
  handles: ["selank", "semax"],
  contents: "VETUD box with one 10 ml nasal spray bottle",
} as const

const PEN_KIT_FORM = "Dual-chamber vial, vial or pen kit box"

/** A product's boxed format: the pen kit box, or the nasal spray for Selank and Semax. */
export const boxFormat = (handle: string) => (NASAL_SPRAY.handles as readonly string[]).includes(handle)
  ? { title: NASAL_SPRAY.title, contents: NASAL_SPRAY.contents, form: "Nasal spray, dual-chamber vial or vial" }
  : { title: PEN_KIT_BOX.title, contents: PEN_KIT_BOX.contents, form: PEN_KIT_FORM }
