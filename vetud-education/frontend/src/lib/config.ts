export const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9100"

export const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8100").replace(/\/$/, "")

/** The separate shop. While this is empty, every link to it is hidden. */
export const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL || "").replace(/\/$/, "")

export const SITE = {
  name: "VETUD",
  email: "contact@vetud.com",
  description: "Plain-language guides to peptide research: what the studies show, what is still unknown and what is approved.",
  siteNotice: "VETUD explains published peptide research in plain language. It is general information for education only and is not medical advice.",
}
