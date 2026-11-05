import type { HttpTypes } from "@medusajs/types"
import { findDose } from "@/lib/community/format"
import type { Evidence, StatusId } from "./learn/categories"
import { getPeptide, type PeptideProfile, type Source, type StudyResult } from "./learn/peptides"

/**
 * The plain-language "Research overview" of a product page, built from the learning library's
 * profile of the same compound (or each compound of a blend), so the shop and the library say the
 * same thing: what it is, how strong the evidence is, published results, what isn't known yet.
 */
export type ProductOverview = {
  name: string
  summary: string
  sections: { title: string; text: string }[]
  /** Study findings, leaving out any that mention doses. */
  findings: string[]
  status?: { id: StatusId; note: string }
  evidence?: Evidence
  /** Charted results; their `source` indexes into `sources`. */
  results: StudyResult[]
  unknowns: string[]
  risks: string[]
  /** For blends: each compound, with a link to its guide. */
  components: { name: string; text: string; href: string; evidence?: Evidence }[]
  sources: Source[]
  guides: PeptideProfile[]
}

// Findings about dose groups or dosing don't belong next to a research product's amounts.
const DOSE_WORDS = /\bdos(?:e|es|ed|ing|age)\b/i

type CatalogProduct = Pick<HttpTypes.StoreProduct, "handle" | "title" | "subtitle" | "description" | "metadata">

/** Products the library doesn't profile. */
const OWN_OVERVIEWS: Record<string, Pick<ProductOverview, "summary" | "sections" | "sources">> = {
  glutathione: {
    summary: "The body's main antioxidant, made by every cell.",
    sections: [
      { title: "What it is", text: "Glutathione is a tripeptide: three amino acids (glutamate, cysteine and glycine) joined together. Cells make it themselves, and the liver holds some of the highest levels." },
      { title: "How it works", text: "It neutralises reactive oxygen molecules that can damage cells, and helps the liver process and clear many substances. Researchers study it in oxidative stress, liver function and skin pigmentation." },
    ],
    sources: [{ title: "Glutathione metabolism and its implications for health", detail: "Wu et al. · Journal of Nutrition · 2004", url: "https://pubmed.ncbi.nlm.nih.gov/14988435/" }],
  },
  "u-100-syringes": {
    summary: "Sterile, single-use U-100 insulin syringes, 10 to a box.",
    sections: [
      { title: "What it is", text: "Each syringe has a fixed needle under an orange cap and a barrel marked in units for U-100 solutions (100 units per ml). They come sealed, 10 to a VETUD box." },
      { title: "How it's used", text: "Laboratories use them to measure and transfer small volumes of reconstituted material. Each syringe is for one use only; dispose of it in a sharps container." },
    ],
    sources: [],
  },
  "bacteriostatic-water": {
    summary: "Sterile water with a little benzyl alcohol, used to dissolve freeze-dried materials in the lab.",
    sections: [
      { title: "What it is", text: "Bacteriostatic water is sterile water with 0.9% benzyl alcohol. The benzyl alcohol slows the growth of bacteria, so a vial can be opened more than once." },
      { title: "How it's used", text: "Laboratories use it to reconstitute (dissolve) freeze-dried powders. The VETUD dual-chamber cartridge already holds it in its second chamber; the vial is for your own lab supplies." },
    ],
    sources: [],
  },
}

const noDose = (text: string) => !findDose(text) && !DOSE_WORDS.test(text)

function learnSlugs(product: CatalogProduct) {
  const topics = product.metadata?.learn_peptides
  const slugs = Array.isArray(topics) ? topics.filter((topic): topic is string => typeof topic === "string") : []
  return slugs.length ? slugs : product.handle ? [product.handle] : []
}

/** The library profiles a product is about: one compound, or each compound of a blend. */
export function getProductGuides(product: CatalogProduct): PeptideProfile[] {
  return learnSlugs(product).flatMap((slug) => getPeptide(slug) ?? [])
}

export function getProductOverview(product: CatalogProduct): ProductOverview | undefined {
  const guides = getProductGuides(product)
  const own = product.handle ? OWN_OVERVIEWS[product.handle] : undefined
  if (own) return { name: product.title ?? "", ...own, findings: [], results: [], unknowns: [], risks: [], components: [], guides }
  if (guides.length === 1) {
    const [peptide] = guides
    // Sources named after a dose (e.g. "Oral Semaglutide at a Dose of 25 mg") stay on the library
    // page, together with the results they back.
    const sources = peptide.sources.filter((source) => noDose(source.title))
    const results = (peptide.results ?? [])
      .filter((result) => [result.title, result.study, result.finding ?? ""].every(noDose) && sources.includes(peptide.sources[result.source]))
      .map((result) => ({ ...result, source: sources.indexOf(peptide.sources[result.source]) }))
    // Findings the charts already show (they repeat a charted number) aren't listed again.
    // Small whole numbers ("1 study") are too common to identify a finding, so only distinctive values count.
    const charted = new Set(results.flatMap((result) => (result.bars ?? []).map((bar) => bar.value)).filter((value) => value >= 10 || !Number.isInteger(value)))
    const repeats = (finding: string) => (finding.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some((number) => charted.has(parseFloat(number.replace(/,/g, ""))))
    return {
      name: peptide.name,
      summary: peptide.oneLiner,
      sections: [{ title: "What it is", text: peptide.whatItIs }, { title: "How it works", text: peptide.howItWorks }],
      // With charted results, the findings list only adds what the charts don't cover.
      findings: peptide.findings.filter((finding) => noDose(finding) && !repeats(finding)).slice(0, 3),
      status: { id: peptide.status, note: peptide.statusNote },
      evidence: peptide.evidence,
      results,
      unknowns: (peptide.unknowns ?? []).filter(noDose),
      risks: peptide.risks.filter(noDose),
      components: [],
      sources,
      guides,
    }
  }
  if (guides.length > 1) {
    // Blends: the product's own description says what it is; each compound links to its guide.
    const about = product.description?.split("\n\n")[0]?.trim()
    return {
      name: product.title ?? "",
      summary: product.subtitle ?? "",
      sections: about ? [{ title: "What it is", text: about }] : [],
      findings: [],
      results: [],
      unknowns: ["No published study has tested this combination. What is known comes from studies of each compound on its own."],
      risks: [],
      components: guides.map((peptide) => ({ name: peptide.name, text: peptide.oneLiner, href: `/learn/${peptide.slug}`, evidence: peptide.evidence })),
      sources: guides.flatMap((peptide) => peptide.sources.slice(0, 1)).slice(0, 3),
      guides,
    }
  }
  return undefined
}
