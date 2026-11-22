/**
 * Everything the owner may want to change lives here: products, prices, the offer, pictures and
 * contacts. Prices are in US dollars. `regular` prices match the shop's pen prices
 * (vetud-shop/backend/src/seed/dual-chamber-catalog.ts, pen column); buyers pay the offer price below.
 */

export const SITE = {
  name: "VETUD Tirzepatide & Retatrutide Pens",
  brand: "VETUD Peptide Series",
  email: "contact@vetud.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8200").replace(/\/$/, ""),
  description:
    "Tirzepatide (TZ-2) and Retatrutide pens by VETUD. 20 mg or 40 mg, ≥99% purity with a COA for every lot. Launch offer: 40% off. Order in under a minute.",
  // The shop's research-use notice. Keep this wording exact.
  ruoNotice:
    "All products sold on this website are intended for research and identification purposes only. These products are not intended for human dosing, injection, or ingestion.",
}

/**
 * The offer. `salePercent` comes off every regular price, and is what buyers pay (the server works
 * the price out from here). The extra subscriber discount comes on top; its code is set in the
 * PROMO_CODE env var (default VETUD10) and is only revealed after subscribing.
 * Set salePercent to 0 to end the sale.
 */
export const OFFER = {
  salePercent: 40,
  saleLabel: "Black Friday",
  subscriberPercent: 10,
}

/**
 * Chat contacts. Fill in a value to show that button everywhere on the page; leave it empty to hide it.
 * - telegram: the username without "@" (https://t.me/<username>)
 * - whatsapp: the full number with country code, digits only (https://wa.me/<number>)
 * - line: the LINE ID (https://line.me/ti/p/~<id>)
 */
export const CONTACTS = {
  telegram: "",
  whatsapp: "",
  line: "",
  email: SITE.email,
}

export const STRENGTHS = ["20mg", "40mg"] as const
export type Strength = (typeof STRENGTHS)[number]

export const PRODUCT_IDS = ["tz2", "retatrutide"] as const
export type ProductId = (typeof PRODUCT_IDS)[number]

export type Product = {
  id: ProductId
  name: string
  /** The label code printed on VETUD packaging, shown next to the name. */
  label?: string
  fullName: string
  code: string
  tagline: string
  description: string
  badge: { text: string; tone: "hot" | "popular" }
  /** Regular prices, before the offer. */
  prices: Record<Strength, number>
  /** The closed box, shown first. */
  image: string
  /** The molecule's artwork on vetud.com (dark, abstract), for night backgrounds. */
  art: string
  gallery: { src: string; alt: string; label: string }[]
}

export const PRODUCTS: Record<ProductId, Product> = {
  tz2: {
    id: "tz2",
    name: "Tirzepatide",
    label: "TZ-2",
    fullName: "Tirzepatide (TZ-2) Pen",
    code: "VTD-TZ2",
    tagline: "Dual GIP / GLP-1 receptor agonist",
    description: "The dual agonist the whole field talks about, in VETUD's precision pen. One pen, 12 needles and a booklet per box.",
    badge: { text: "Very popular", tone: "popular" },
    prices: { "20mg": 398, "40mg": 588 },
    image: "/images/tirzepatide-closed.webp",
    art: "/images/tirzepatide-art.webp",
    gallery: [
      { src: "/images/tirzepatide-closed.webp", alt: "VETUD Tirzepatide pen box, closed", label: "Box" },
      { src: "/images/tirzepatide-open.webp", alt: "VETUD Tirzepatide box, open: pen, 12 needles and booklet", label: "Inside" },
    ],
  },
  retatrutide: {
    id: "retatrutide",
    name: "Retatrutide",
    fullName: "Retatrutide Pen",
    code: "VTD-RT",
    tagline: "Triple GIP / GLP-1 / glucagon agonist",
    description: "The next-generation triple agonist, in VETUD's precision pen. One pen, 12 needles and a booklet per box.",
    badge: { text: "Best seller", tone: "hot" },
    prices: { "20mg": 488, "40mg": 688 },
    image: "/images/retatrutide-closed.webp",
    art: "/images/retatrutide-art.webp",
    gallery: [
      { src: "/images/retatrutide-closed.webp", alt: "VETUD Retatrutide pen box, closed", label: "Box" },
      { src: "/images/retatrutide-open.webp", alt: "VETUD Retatrutide box, open: pen, 12 needles and booklet", label: "Inside" },
    ],
  },
}

export const MAX_QUANTITY = 10

export const strengthLabel = (strength: Strength) => strength.replace("mg", " mg")

export const formatUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)

/** Regular price and the offer price buyers pay, in whole dollars. */
export function priceOf(product: ProductId, strength: Strength) {
  const regular = PRODUCTS[product].prices[strength]
  return { regular, sale: Math.round(regular * (1 - OFFER.salePercent / 100)) }
}

/** Offer price per mg, for the "best value" tag. */
export const pricePerMg = (product: ProductId, strength: Strength) => priceOf(product, strength).sale / parseInt(strength, 10)

/** The most a buyer can save with the offer and the subscriber code together (40% then 10% = 46%). */
export const bestCombinedPercent = () => Math.round(100 - ((100 - OFFER.salePercent) * (100 - OFFER.subscriberPercent)) / 100)

/** The lowest offer price on the page ("from $…"). */
export const lowestPrice = () =>
  Math.min(...PRODUCT_IDS.flatMap((id) => STRENGTHS.map((strength) => priceOf(id, strength).sale)))

export type ContactKey = keyof typeof CONTACTS

export function contactLinks() {
  const links: { key: ContactKey; label: string; value: string; href: string }[] = []
  if (CONTACTS.telegram) links.push({ key: "telegram", label: "Telegram", value: `@${CONTACTS.telegram}`, href: `https://t.me/${CONTACTS.telegram}` })
  if (CONTACTS.whatsapp) links.push({ key: "whatsapp", label: "WhatsApp", value: `+${CONTACTS.whatsapp}`, href: `https://wa.me/${CONTACTS.whatsapp}` })
  if (CONTACTS.line) links.push({ key: "line", label: "LINE", value: CONTACTS.line, href: `https://line.me/ti/p/~${CONTACTS.line}` })
  if (CONTACTS.email) links.push({ key: "email", label: "Email", value: CONTACTS.email, href: `mailto:${CONTACTS.email}` })
  return links
}
