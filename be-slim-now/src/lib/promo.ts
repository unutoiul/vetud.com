import "server-only"

/**
 * The subscriber code (extra discount on top of the launch offer). It stays on the server: visitors
 * only see it after subscribing, and the order route checks it before giving the discount.
 */
export const promoCode = () => (process.env.PROMO_CODE || "VETUD10").trim().toUpperCase()

export const isPromoCode = (code: string | undefined | null) => !!code && code.trim().toUpperCase() === promoCode()
