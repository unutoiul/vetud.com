import type { CategoryId } from "./categories"

/**
 * Peptides that have a page in the library but no guide yet. Each page says the guide is being written
 * and stays out of search engines and the sitemap. To publish one, write its full profile in
 * peptides.ts with the same slug and remove it from this list.
 *
 * Added 2026-11-12: Glutathione (sold by the shop), LL-37, Dihexa and PEG-MGF (FDA compounding list
 * article), Adipotide (weight research article), and peptides that are widely discussed.
 */
export type PlannedPeptide = { slug: string; name: string; aka?: string; category: CategoryId }

export const PLANNED_PEPTIDES: PlannedPeptide[] = [
  { slug: "survodutide", name: "Survodutide", aka: "BI 456906", category: "weight" },
  { slug: "mazdutide", name: "Mazdutide", aka: "LY3305677, IBI362", category: "weight" },
  { slug: "exenatide", name: "Exenatide", aka: "Byetta, Bydureon", category: "weight" },
  { slug: "dulaglutide", name: "Dulaglutide", aka: "Trulicity", category: "weight" },
  { slug: "setmelanotide", name: "Setmelanotide", aka: "Imcivree", category: "weight" },
  { slug: "adipotide", name: "Adipotide", aka: "FTPP", category: "weight" },
  { slug: "matrixyl", name: "Matrixyl", aka: "Palmitoyl pentapeptide-4", category: "skin" },
  { slug: "snap-8", name: "SNAP-8", aka: "Acetyl octapeptide-3", category: "skin" },
  { slug: "peg-mgf", name: "PEG-MGF", aka: "Pegylated mechano growth factor", category: "growth" },
  { slug: "ghrp-2", name: "GHRP-2", aka: "Pralmorelin", category: "growth" },
  { slug: "ghrp-6", name: "GHRP-6", aka: "Growth hormone-releasing peptide 6", category: "growth" },
  { slug: "hexarelin", name: "Hexarelin", aka: "Examorelin", category: "growth" },
  { slug: "dihexa", name: "Dihexa", aka: "PNB-0408", category: "focus" },
  { slug: "glutathione", name: "Glutathione", aka: "GSH", category: "longevity" },
  { slug: "humanin", name: "Humanin", aka: "Mitochondria-derived peptide", category: "longevity" },
  { slug: "foxo4-dri", name: "FOXO4-DRI", aka: "Proxofim", category: "longevity" },
  { slug: "gonadorelin", name: "Gonadorelin", aka: "GnRH", category: "fertility" },
  { slug: "ll-37", name: "LL-37", aka: "Cathelicidin", category: "immune" },
  { slug: "thymalin", name: "Thymalin", aka: "Thymus peptide extract", category: "immune" },
  { slug: "pramlintide", name: "Pramlintide", aka: "Symlin", category: "medicines" },
]

export function getPlannedPeptide(slug: string) {
  return PLANNED_PEPTIDES.find((peptide) => peptide.slug === slug)
}
