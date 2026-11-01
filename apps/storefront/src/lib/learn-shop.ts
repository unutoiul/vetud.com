import "server-only"
import { PEPTIDES } from "@/content/learn/peptides"
import { matchesPeptide } from "./learn-products"
import { getCurrentRegion } from "./medusa/current-region"
import { listCatalogProducts } from "./medusa/products"

/** Peptide slug -> product page path, for slugs with a matching product in the visitor's region. */
export type ShopLinks = Record<string, string>

/**
 * Where learning pages point when they mention a peptide the shop carries. Only whether a
 * product exists is read here (cached per region); live stock stays in ResearchCatalog.
 */
export async function getLearnShopLinks(): Promise<ShopLinks> {
  try {
    const { region } = await getCurrentRegion()
    const products = await listCatalogProducts(region.id)
    return Object.fromEntries(PEPTIDES.flatMap((peptide) => {
      const product = products.find((candidate) => candidate.handle && matchesPeptide(candidate, peptide.slug))
      return product ? [[peptide.slug, `/products/${product.handle}`]] : []
    }))
  } catch {
    // The pages still work as plain education when the catalog can't be reached.
    return {}
  }
}
