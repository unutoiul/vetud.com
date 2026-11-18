import type { CategoryId } from "./categories"

/**
 * Peptides that have a page in the library but no guide yet. Each page says the guide is being written
 * and stays out of search engines and the sitemap. To publish one, write its full profile in
 * the published peptide library with the same slug and remove it from this list.
 */
export type PlannedPeptide = { slug: string; name: string; aka?: string; category: CategoryId }

export const PLANNED_PEPTIDES: PlannedPeptide[] = []

export function getPlannedPeptide(slug: string) {
  return PLANNED_PEPTIDES.find((peptide) => peptide.slug === slug)
}
