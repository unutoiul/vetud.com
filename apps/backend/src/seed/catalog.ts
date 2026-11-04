/**
 * Placeholder catalog for the Vetud storefront. Replace names, prices and lots with real
 * products (here before first deploy, or later in Medusa Admin).
 *
 * Prices are US dollars in major units (49 = $49.00). Every other currency is converted from them
 * (workflows/sync-currency-prices.ts).
 */

export const REGIONS = [
  { name: "United States", currency_code: "usd", countries: ["us"] },
  {
    name: "Europe",
    currency_code: "eur",
    countries: ["de", "fr", "nl", "be", "at", "ie", "it", "es"],
  },
] as const

/** Flat shipping in USD, the same in every country. Raised on 2026-11-04 (was 9.95 / 24.95). */
export const SHIPPING = { standard: 24.95, express: 50 }

export const CATEGORIES = [
  { name: "Peptide Series", handle: "peptide-series", description: "Single-sequence research peptides." },
  { name: "Blends", handle: "blends", description: "Multi-sequence research preparations." },
  { name: "Lab Supplies", handle: "lab-supplies", description: "Reconstitution and handling supplies." },
] as const

export const FEATURED_COLLECTION = { title: "Featured", handle: "featured" }

/** Shared product option. Each product links the subset of values it sells. */
export const AMOUNT_OPTION = {
  title: "Amount",
  values: ["5 mg", "10 mg", "20 mg", "40 mg", "10 ml", "30 ml"],
}

type SeedVariant = {
  amount: (typeof AMOUNT_OPTION.values)[number]
  usd: number
  stock: number
}

export type SeedProduct = {
  title: string
  handle: string
  subtitle: string
  description: string
  category: (typeof CATEGORIES)[number]["handle"]
  featured: boolean
  weight: number
  /** File in assets/products/, uploaded as the product photo. */
  image?: string
  metadata: {
    code: string
    accent: string
    purity: string
    form: string
    storage: string
    lots: string
  }
  variants: SeedVariant[]
}

const PEPTIDE_DESCRIPTION =
  "A lyophilized research peptide supplied for in-vitro laboratory investigation. Each vial is filled under controlled conditions and documented by lot, with HPLC purity and mass-spectrometry identity data available for every batch."

const BLEND_DESCRIPTION =
  "A multi-sequence research preparation supplied as a single lyophilized vial for laboratory investigation. Every lot is documented with the purity and identity of each component."

const PEPTIDE_SPECS = {
  purity: "≥ 99% (HPLC)",
  form: "Lyophilized powder",
  storage: "-20 °C, desiccated, protected from light",
}

function peptide(
  index: number,
  accent: string,
  prices: { small: number; large: number },
  featured = false
): SeedProduct {
  const number = String(index).padStart(2, "0")
  return {
    title: `Peptide Series ${number}`,
    handle: `peptide-series-${number}`,
    subtitle: "Single-sequence research peptide",
    description: PEPTIDE_DESCRIPTION,
    category: "peptide-series",
    featured,
    weight: 40,
    metadata: {
      code: `VTD-${number}`,
      accent,
      ...PEPTIDE_SPECS,
      lots: `VTD${number}-2609A|2026-09|99.4%; VTD${number}-2607B|2026-07|99.2%`,
    },
    variants: [
      { amount: "5 mg", usd: prices.small, stock: 100 },
      { amount: "10 mg", usd: prices.large, stock: 100 },
    ],
  }
}

/** Product 1, with its own photo. Prices are placeholders: edit them in Medusa Admin. */
export const RETATRUTIDE: SeedProduct = {
  title: "Retatrutide",
  handle: "retatrutide",
  subtitle: "Research peptide · 40 mg vial",
  description: PEPTIDE_DESCRIPTION,
  category: "peptide-series",
  featured: true,
  weight: 40,
  image: "retatrutide-40mg.png",
  metadata: {
    code: "VTD-01",
    accent: "#3cc7c2",
    ...PEPTIDE_SPECS,
    lots: "VTD01-2609A|2026-09|99.4%; VTD01-2607B|2026-07|99.2%",
  },
  variants: [{ amount: "40 mg", usd: 159, stock: 100 }],
}

export const PRODUCTS: SeedProduct[] = [
  RETATRUTIDE,
  peptide(2, "#23618a", { small: 54, large: 96 }, true),
  peptide(3, "#5ba79b", { small: 59, large: 104 }, true),
  peptide(4, "#6f86c9", { small: 45, large: 82 }),
  peptide(5, "#c39a52", { small: 64, large: 115 }),
  peptide(6, "#c97a72", { small: 69, large: 124 }),
  {
    title: "Research Blend A",
    handle: "research-blend-a",
    subtitle: "Two-sequence research preparation",
    description: BLEND_DESCRIPTION,
    category: "blends",
    featured: true,
    weight: 40,
    metadata: {
      code: "VTD-B1",
      accent: "#4da9a0",
      ...PEPTIDE_SPECS,
      lots: "VTDB1-2608A|2026-08|99.1%",
    },
    variants: [
      { amount: "10 mg", usd: 119, stock: 60 },
      { amount: "20 mg", usd: 209, stock: 40 },
    ],
  },
  {
    title: "Research Blend B",
    handle: "research-blend-b",
    subtitle: "Three-sequence research preparation",
    description: BLEND_DESCRIPTION,
    category: "blends",
    featured: false,
    weight: 40,
    metadata: {
      code: "VTD-B2",
      accent: "#3e7394",
      ...PEPTIDE_SPECS,
      lots: "VTDB2-2608A|2026-08|99.0%",
    },
    variants: [
      { amount: "10 mg", usd: 129, stock: 60 },
      { amount: "20 mg", usd: 229, stock: 40 },
    ],
  },
  {
    title: "Bacteriostatic Water",
    handle: "bacteriostatic-water",
    subtitle: "Sterile diluent for reconstitution",
    description:
      "Sterile water with 0.9% benzyl alcohol, supplied in sealed multi-use vials for reconstituting lyophilized research materials.",
    category: "lab-supplies",
    featured: false,
    weight: 60,
    metadata: {
      code: "VTD-S1",
      accent: "#8fb9b1",
      purity: "USP grade",
      form: "Sterile solution",
      storage: "Room temperature, out of direct light",
      lots: "VTDS1-2609A|2026-09|USP",
    },
    variants: [
      { amount: "10 ml", usd: 12, stock: 500 },
      { amount: "30 ml", usd: 24, stock: 500 },
    ],
  },
]
