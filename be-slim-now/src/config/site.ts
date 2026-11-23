/**
 * Everything the owner may want to change lives here: products, prices, the offer, pictures and
 * contacts. Prices are set per currency in PRICE_LISTS below; which country pays which list is in
 * src/config/markets.ts. Buyers pay the offer price worked out from these regular prices.
 *
 * The words on the page are not here: they are in src/i18n/messages/<country>.json (us.json is the
 * English source). What stays here in English is used by the emails and the server.
 */

export const SITE = {
  name: "VETUD Tirzepatide & Retatrutide Pens",
  brand: "VETUD Peptide Series",
  email: "contact@vetud.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8200").replace(/\/$/, ""),
  description:
    "Tirzepatide (TZ-2) and Retatrutide pens by VETUD. 20 mg or 40 mg, ≥99% purity with a COA for every lot. Launch offer: 40% off. Order in under a minute.",
  // The shop's research-use notice (the page shows its copy from the messages: faq). Keep this wording exact.
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
  /** For the emails. The page's label is offer.saleLabel in the messages. */
  saleLabel: "Black Friday",
  subscriberPercent: 10,
}

/**
 * Weight-loss result shown in the hero. Kept separate from the discount offer so the two claims
 * aren't confused. The percent is animated with CountUp when the hero paints; the sentence around
 * it is hero.weightLoss in the messages.
 */
export const WEIGHT_LOSS = {
  percent: 24,
}

/**
 * Human-trial weight-loss results shown under the hero pens. Ordered by reported average;
 * each medicine was compared with its own trial's placebo group — this is not a head-to-head
 * ranking. Trials differ in people, doses and length, so compare with care.
 * Each trial's status, dose and study line are trialChart.trials.<name> in the messages.
 *   Retatrutide: Phase 2 · 12 mg weekly · 48 weeks · 338 people
 *   Tirzepatide: SURMOUNT-1 · 15 mg weekly (Zepbound) · 72 weeks · 2,539 people
 *   Semaglutide: STEP 1 · 2.4 mg weekly injection (Wegovy) · 68 weeks · 1,961 people
 */
export const TRIAL_DATA = [
  { name: "Retatrutide", medicine: 24.2, placebo: 2.1 },
  { name: "Tirzepatide", medicine: 20.9, placebo: 3.1 },
  { name: "Semaglutide", medicine: 14.9, placebo: 2.4 },
] as const

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

/**
 * A product's facts. Its tagline, description, badge text and picture captions are
 * products.<id> in the messages.
 */
export type Product = {
  id: ProductId
  /** The molecule's name, the same in every language. */
  name: string
  /** The label code printed on VETUD packaging, shown next to the name. */
  label?: string
  /** For the emails; the page uses products.<id>.fullName in the messages. */
  fullName: string
  code: string
  /** "hot" is the gold best seller, "popular" the navy one. */
  tone: "hot" | "popular"
  /** The closed box, shown first. */
  image: string
  /** The molecule's artwork on vetud.com (dark, abstract), for night backgrounds. */
  art: string
  /** Pictures in the product card, in order; captions are products.<id>.gallery in the messages. */
  gallery: string[]
}

export const PRODUCTS: Record<ProductId, Product> = {
  tz2: {
    id: "tz2",
    name: "Tirzepatide",
    label: "TZ-2",
    fullName: "Tirzepatide (TZ-2) Pen",
    code: "VTD-TZ2",
    tone: "popular",
    image: "/images/tirzepatide-closed.webp",
    art: "/images/tirzepatide-art.webp",
    gallery: ["/images/tirzepatide-closed.webp", "/images/tirzepatide-open.webp"],
  },
  retatrutide: {
    id: "retatrutide",
    name: "Retatrutide",
    fullName: "Retatrutide Pen",
    code: "VTD-RT",
    tone: "hot",
    image: "/images/retatrutide-closed.webp",
    art: "/images/retatrutide-art.webp",
    gallery: ["/images/retatrutide-closed.webp", "/images/retatrutide-open.webp"],
  },
}

export type PriceList = {
  /** ISO 4217 code: what buyers see and pay in. */
  currency: string
  /** Regular prices before the offer, in whole units of the currency. */
  prices: Record<ProductId, Record<Strength, number>>
}

/**
 * Regular prices (before the offer) in each currency, in whole units. Buyers pay these minus
 * OFFER.salePercent, and the server works every total out from here.
 *
 * - USD matches the shop's pen prices (vetud-shop/backend/src/seed/dual-chamber-catalog.ts, pen column).
 * - The others were converted from USD at mid-2026 exchange rates and rounded to a price ending in
 *   9 or 90. They are plain numbers: change any of them freely.
 * - To charge some countries differently, add a list here (e.g. `EUR_EAST` with currency "EUR")
 *   and point those countries at it in src/config/markets.ts.
 */
export const PRICE_LISTS = {
  USD: { currency: "USD", prices: { tz2: { "20mg": 398, "40mg": 588 }, retatrutide: { "20mg": 488, "40mg": 688 } } },
  EUR: { currency: "EUR", prices: { tz2: { "20mg": 339, "40mg": 509 }, retatrutide: { "20mg": 419, "40mg": 589 } } },
  GBP: { currency: "GBP", prices: { tz2: { "20mg": 299, "40mg": 439 }, retatrutide: { "20mg": 369, "40mg": 509 } } },
  CHF: { currency: "CHF", prices: { tz2: { "20mg": 319, "40mg": 469 }, retatrutide: { "20mg": 389, "40mg": 549 } } },
  SEK: { currency: "SEK", prices: { tz2: { "20mg": 3790, "40mg": 5590 }, retatrutide: { "20mg": 4590, "40mg": 6490 } } },
  NOK: { currency: "NOK", prices: { tz2: { "20mg": 3990, "40mg": 5990 }, retatrutide: { "20mg": 4890, "40mg": 6990 } } },
  DKK: { currency: "DKK", prices: { tz2: { "20mg": 2590, "40mg": 3790 }, retatrutide: { "20mg": 3090, "40mg": 4390 } } },
  PLN: { currency: "PLN", prices: { tz2: { "20mg": 1459, "40mg": 2149 }, retatrutide: { "20mg": 1789, "40mg": 2519 } } },
  CZK: { currency: "CZK", prices: { tz2: { "20mg": 8390, "40mg": 12390 }, retatrutide: { "20mg": 10290, "40mg": 14490 } } },
  HUF: { currency: "HUF", prices: { tz2: { "20mg": 132990, "40mg": 196990 }, retatrutide: { "20mg": 162990, "40mg": 229990 } } },
  RON: { currency: "RON", prices: { tz2: { "20mg": 1739, "40mg": 2579 }, retatrutide: { "20mg": 2139, "40mg": 2999 } } },
} as const satisfies Record<string, PriceList>

export type PriceListId = keyof typeof PRICE_LISTS

export const MAX_QUANTITY = 10

export const strengthLabel = (strength: Strength) => strength.replace("mg", " mg")

/** The most a buyer can save with the offer and the subscriber code together (40% then 10% = 46%). */
export const bestCombinedPercent = () => Math.round(100 - ((100 - OFFER.salePercent) * (100 - OFFER.subscriberPercent)) / 100)

export type ContactKey = keyof typeof CONTACTS

export function contactLinks() {
  const links: { key: ContactKey; label: string; value: string; href: string }[] = []
  if (CONTACTS.telegram) links.push({ key: "telegram", label: "Telegram", value: `@${CONTACTS.telegram}`, href: `https://t.me/${CONTACTS.telegram}` })
  if (CONTACTS.whatsapp) links.push({ key: "whatsapp", label: "WhatsApp", value: `+${CONTACTS.whatsapp}`, href: `https://wa.me/${CONTACTS.whatsapp}` })
  if (CONTACTS.line) links.push({ key: "line", label: "LINE", value: CONTACTS.line, href: `https://line.me/ti/p/~${CONTACTS.line}` })
  if (CONTACTS.email) links.push({ key: "email", label: "Email", value: CONTACTS.email, href: `mailto:${CONTACTS.email}` })
  return links
}
