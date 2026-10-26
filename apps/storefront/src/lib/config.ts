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
export const FALLBACK_COUNTRIES = [
  "us",
  // Eurozone
  "at", "be", "bg", "cy", "de", "ee", "es", "fi", "fr", "gr", "hr",
  "ie", "it", "lt", "lu", "lv", "mt", "nl", "pt", "si", "sk",
  // Other European destinations (all priced in EUR)
  "gb", "ch", "li", "se", "no", "dk", "pl", "cz", "hu", "ro", "is",
  // Main global currency markets
  "ca", "au", "jp", "cn", "sg", "hk", "ae",
]

export const PAYMENT_BANK_DETAILS = process.env.NEXT_PUBLIC_PAYMENT_BANK_DETAILS || ""

export const SITE = {
  name: "Vetud Peptides",
  shortName: "Vetud",
  email: "contact@vetud.com",
  description:
    "Research-grade peptides with lot-level documentation. Precise information, traceable batches and responsive support for laboratory research.",
  ruoNotice:
    "All products are sold for laboratory research use only. Not for human or veterinary use, and not for use as food, drugs, cosmetics or household chemicals.",
}
