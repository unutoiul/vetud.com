export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
)

export const DEFAULT_COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us").toLowerCase()

/**
 * Used before Medusa answers (proxy fallback, build-time params). Keep in sync with the
 * regions in Medusa Admin; the live region list always wins when the backend is reachable.
 */
export const FALLBACK_COUNTRIES = ["us", "de", "fr", "nl", "be", "at", "ie", "it", "es"]

/** Mirrors the free-shipping price rule seeded on the Standard shipping option. */
export const FREE_SHIPPING_THRESHOLD: Record<string, number> = { usd: 200, eur: 200 }

export const PAYMENT_BANK_DETAILS = process.env.NEXT_PUBLIC_PAYMENT_BANK_DETAILS || ""

export const SITE = {
  name: "Vetud Peptides",
  shortName: "Vetud",
  email: "hello@vetud.example",
  announcement: "Lot-documented research materials · Free standard shipping over 200",
  description:
    "Research-grade peptides with lot-level documentation. Precise information, traceable batches and responsive support for laboratory research.",
  ruoNotice:
    "All products are sold for laboratory research use only. Not for human or veterinary use, and not for use as food, drugs, cosmetics or household chemicals.",
}
