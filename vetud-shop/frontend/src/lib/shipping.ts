/** A missing quote is unavailable, never free. Zero is a valid quoted price. */
export function hasShippingPrice(option: { amount?: number | null }) {
  return typeof option.amount === "number" && Number.isFinite(option.amount) && option.amount >= 0
}
