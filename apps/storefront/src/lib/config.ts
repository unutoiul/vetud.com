export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
)

export const DEFAULT_COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us").toLowerCase()

/**
 * The countries we sell to for now. Every other country and region in Medusa is hidden from the
 * storefront (country selector, checkout, URLs and the geo redirect). Add a country here once its
 * pricing, shipping and legal pages are ready. Override with NEXT_PUBLIC_SUPPORTED_COUNTRIES
 * (comma-separated ISO codes). Each country must belong to a Medusa region.
 */
export const SUPPORTED_COUNTRIES = (process.env.NEXT_PUBLIC_SUPPORTED_COUNTRIES || "us,gb,de,fr,nl")
  .split(",")
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean)

/** Used before Medusa answers (proxy fallback, build-time params). */
export const FALLBACK_COUNTRIES = SUPPORTED_COUNTRIES

export const PAYMENT_BANK_DETAILS = process.env.NEXT_PUBLIC_PAYMENT_BANK_DETAILS || ""

export const SITE = {
  name: "Vetud Peptides",
  shortName: "Vetud",
  legalName: "Vetud LTD",
  address: "390 Fulham Road, London",
  email: "contact@vetud.com",
  description:
    "Research-grade peptides with lot-level documentation. Precise information, traceable batches and responsive support for laboratory research.",
  // Footer disclaimer (also shown on each product page). Keep this wording exact.
  ruoNotice:
    "All products sold on this website are intended for research and identification purposes only. These products are not intended for human dosing, injection, or ingestion.",
  // Shown on every product page and product card. Keep this wording exact.
  productDisclaimer: "All Products listed on this site are for research purposes only",
}
