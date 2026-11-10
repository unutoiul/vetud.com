import guideProducts from "@/content/learn/guide-product-map.json"
import { SHOP_URL } from "@/lib/config"

const MAP: Record<string, string> = guideProducts

/** The shop's page for a guide's peptide, when the shop carries it. The shop adds the visitor's country. */
export function guideProductUrl(slug: string) {
  const handle = MAP[slug]
  return handle && SHOP_URL ? `${SHOP_URL}/products/${handle}` : null
}
