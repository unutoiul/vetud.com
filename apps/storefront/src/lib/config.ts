import countryRules from "../i18n/countries.json"

export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
)

export const DEFAULT_COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us").toLowerCase()

/**
 * The countries we sell to: every country with address rules in i18n/countries.json (since
 * 2026-11-05 Europe, the US, Canada and Australia). Every other country and region in Medusa is
 * hidden from the storefront (country selector, checkout, URLs and the geo redirect). Override with
 * NEXT_PUBLIC_SUPPORTED_COUNTRIES (comma-separated ISO codes). Each country must belong to a Medusa region.
 */
export const SUPPORTED_COUNTRIES = (process.env.NEXT_PUBLIC_SUPPORTED_COUNTRIES || Object.keys(countryRules).join(","))
  .split(",")
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean)

/**
 * Countries whose pages are built ahead of time. The others (most of Europe) render the first time
 * they're visited and are cached from then on, which keeps builds to about a thousand pages.
 */
export const PRERENDERED_COUNTRIES = ["us", "gb", "de", "fr", "nl", "ca", "au"]

/** Used before Medusa answers (proxy fallback, build-time params). */
export const FALLBACK_COUNTRIES = SUPPORTED_COUNTRIES

export const PAYMENT_BANK_DETAILS = process.env.NEXT_PUBLIC_PAYMENT_BANK_DETAILS || ""

export const SITE = {
  name: "Vetud Peptides",
  shortName: "Vetud",
  email: "contact@vetud.com",
  description:
    "Research-grade peptides with lot-level documentation. Precise information, traceable batches and responsive support for laboratory research.",
  // The body of the research-use notice on research products. Keep this wording exact.
  ruoNotice:
    "All products sold on this website are intended for research and identification purposes only. These products are not intended for human dosing, injection, or ingestion.",
  // The research-use notice on research products (page and card) unless a product sets its own
  // notice in metadata (see readProductNotice). Keep this wording exact.
  productDisclaimer: "All Products listed on this site are for research purposes only",
  // Site-wide statements (footer, homepage): since 2026-11-09 the shop also sells cosmetics.
  siteNotice:
    "Research peptides on this site are intended for laboratory research and identification only. They are not intended for human dosing, injection, or ingestion. Cosmetic products are labelled as such and are for external use on the skin only.",
  catalogNotice: "Research peptides are for laboratory research purposes only. Cosmetic products are for external use on the skin.",
}
