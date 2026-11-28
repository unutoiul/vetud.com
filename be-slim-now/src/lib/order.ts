import { MAX_QUANTITY, OFFER, PRODUCT_IDS, STRENGTHS, type ProductId, type Strength } from "@/config/site"
import { COUNTRY_CODES } from "@/lib/countries"
import { priceOf, pricingCountry } from "@/lib/pricing"

/** Shared by the order form (client) and POST /api/order (server). */

export const CONTACT_APPS = ["whatsapp", "telegram", "line", "email"] as const
export type ContactApp = (typeof CONTACT_APPS)[number]
export const CONTACT_APP_LABELS: Record<ContactApp, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  line: "LINE",
  email: "Email only",
}

export type OrderInput = {
  product: ProductId
  strength: Strength
  quantity: number
  name: string
  email: string
  phone: string
  contactApp: ContactApp
  contactHandle: string
  country: string
  address: string
  city: string
  postalCode: string
  note: string
  /** The subscriber code as typed; the server decides whether it counts. */
  promoCode: string
  /** Honeypot: people never see this field, so it must stay empty. */
  website?: string
}

export const LIMITS = {
  name: 120,
  email: 254,
  phone: 32,
  contactHandle: 80,
  address: 200,
  city: 100,
  postalCode: 20,
  note: 1000,
  promoCode: 32,
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const PHONE_PATTERN = /^\+?[\d\s().-]{6,32}$/

/**
 * Every amount on an order, in whole units of the currency of the country it ships to (see
 * lib/pricing.ts): regular price, the offer price, and the extra subscriber discount when a valid
 * code was given.
 */
export function orderTotal(
  product: ProductId,
  strength: Strength,
  quantity: number,
  withCode: boolean,
  shipTo: string | null | undefined,
) {
  const { regular, sale } = priceOf(product, strength, pricingCountry(shipTo))
  const regularTotal = regular * quantity
  const subtotal = sale * quantity
  const codeDiscount = withCode ? Math.round((subtotal * OFFER.subscriberPercent) / 100) : 0
  const total = subtotal - codeDiscount
  return { regular, unit: sale, regularTotal, subtotal, codeDiscount, total, saved: regularTotal - total }
}

type Result = { ok: true; order: OrderInput } | { ok: false; errors: Record<string, string> }

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "")

/** Checks untrusted input and returns a clean order. Prices are never read from the input. */
export function parseOrder(body: unknown): Result {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  const product = raw.product as ProductId
  if (!PRODUCT_IDS.includes(product)) errors.product = "Choose a pen."
  const strength = raw.strength as Strength
  if (!STRENGTHS.includes(strength)) errors.strength = "Choose a strength."
  const quantity = Number(raw.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY)
    errors.quantity = `Choose 1 to ${MAX_QUANTITY}.`

  const order: OrderInput = {
    product,
    strength,
    quantity,
    name: text(raw.name, LIMITS.name),
    email: text(raw.email, LIMITS.email).toLowerCase(),
    phone: text(raw.phone, LIMITS.phone),
    contactApp: CONTACT_APPS.includes(raw.contactApp as ContactApp) ? (raw.contactApp as ContactApp) : "email",
    contactHandle: text(raw.contactHandle, LIMITS.contactHandle),
    country: text(raw.country, 2).toUpperCase(),
    address: text(raw.address, LIMITS.address),
    city: text(raw.city, LIMITS.city),
    postalCode: text(raw.postalCode, LIMITS.postalCode),
    note: text(raw.note, LIMITS.note),
    promoCode: text(raw.promoCode, LIMITS.promoCode).toUpperCase(),
    website: text(raw.website, 200),
  }

  if (order.name.length < 2) errors.name = "Enter your full name."
  if (!EMAIL_PATTERN.test(order.email)) errors.email = "Enter a valid email."
  if (!PHONE_PATTERN.test(order.phone)) errors.phone = "Enter a phone number with country code."
  if (!COUNTRY_CODES.includes(order.country)) errors.country = "Choose a country."
  if (order.address.length < 4) errors.address = "Enter the street address."
  if (order.city.length < 2) errors.city = "Enter the city."
  if (!order.postalCode) errors.postalCode = "Enter the postal code."

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, order }
}
