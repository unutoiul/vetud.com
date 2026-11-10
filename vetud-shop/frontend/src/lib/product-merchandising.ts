/** Metadata is authoritative; missing flags never imply a merchandising claim. */
export function productMerchandising(product: { metadata?: Record<string, unknown> | null }) {
  const enabled = (value: unknown) => value === true || value === "true"
  return {
    veryPopular: enabled(product.metadata?.very_popular),
    bestSeller: enabled(product.metadata?.best_seller),
  }
}

/** Both labels first, then best sellers, then popular selections. */
export function merchandisingPriority(product: { metadata?: Record<string, unknown> | null }) {
  const { veryPopular, bestSeller } = productMerchandising(product)
  return Number(bestSeller) * 2 + Number(veryPopular)
}
