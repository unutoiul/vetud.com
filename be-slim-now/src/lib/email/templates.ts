import "server-only"
import { OFFER, PRODUCTS, SITE, contactLinks, strengthLabel } from "@/config/site"
import { countryName } from "@/lib/countries"
import { CONTACT_APP_LABELS, orderTotal, type OrderInput } from "@/lib/order"
import { formatPrice, formatPriceWithCode, pricingCountry } from "@/lib/pricing"

/**
 * Turns an order or a subscription into each Resend template's variables. The wording and layout
 * live in emails/ (templates.json + templates/), never here.
 */
export type EmailTemplate = "order-confirmation" | "order-admin" | "promo-code" | "subscribe-admin" | "new-client"

/** Values go into the template HTML as-is, so customer input must be escaped. */
function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const escapeAll = (variables: Record<string, string>) =>
  Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escape(value)]))

function shared(order: OrderInput, orderNumber: string, withCode: boolean) {
  const product = PRODUCTS[order.product]
  // Amounts in the currency of the country the order ships to, written the way people there write them.
  const amounts = orderTotal(order.product, order.strength, order.quantity, withCode, order.country)
  const country = pricingCountry(order.country)
  const money = (amount: number) => formatPrice(amount, country)
  const contactPref =
    order.contactApp === "email"
      ? "email"
      : `${CONTACT_APP_LABELS[order.contactApp]}${order.contactHandle ? ` (${order.contactHandle})` : ` (${order.phone})`}`
  const savings = [
    OFFER.salePercent ? `${OFFER.saleLabel} −${OFFER.salePercent}%: −${money(amounts.regularTotal - amounts.subtotal)}` : "",
    withCode ? `Subscriber code ${order.promoCode} −${OFFER.subscriberPercent}%: −${money(amounts.codeDiscount)}` : "",
  ]
    .filter(Boolean)
    .join("\n")
  return {
    SITE_URL: SITE.url,
    NAME: order.name,
    ORDER_NUMBER: orderNumber,
    ITEM: `${product.fullName} · ${strengthLabel(order.strength)}`,
    QUANTITY: String(order.quantity),
    UNIT_PRICE: money(amounts.regular),
    // With the currency code, so "kr" or "$" can't be mistaken for another currency when paying.
    ORDER_TOTAL: formatPriceWithCode(amounts.total, country),
    SAVINGS: savings ? `${savings}\nYou save ${money(amounts.saved)}` : "Regular price",
    SHIP_TO: [order.name, order.address, `${order.postalCode} ${order.city}`, countryName(order.country)].join("\n"),
    CONTACT_PREF: contactPref,
  }
}

export function confirmationVariables(order: OrderInput, orderNumber: string, withCode: boolean) {
  const payment = [process.env.PAYMENT_BANK_DETAILS, process.env.PAYMENT_CRYPTO_DETAILS]
    .map((line) => line?.trim())
    .filter(Boolean)
    .join("\n")
  return escapeAll({
    ...shared(order, orderNumber, withCode),
    PAYMENT_INSTRUCTIONS:
      process.env.PAYMENT_INSTRUCTIONS?.trim() ||
      "Pay using the details below and put your order number in the payment reference. We ship as soon as the payment arrives.",
    PAYMENT_DETAILS: payment || "We'll send your payment details within a few hours, by email and on the app you chose.",
    CONTACT_LINKS: contactLinks()
      .map((link) => `${link.label}: ${link.key === "email" ? link.value : link.href}`)
      .join("\n"),
  })
}

export function adminVariables(order: OrderInput, orderNumber: string, placedAt: Date, withCode: boolean) {
  return escapeAll({
    ...shared(order, orderNumber, withCode),
    CUSTOMER_EMAIL: order.email,
    PHONE: order.phone,
    NOTE: order.note || "None",
    PLACED_AT: utc(placedAt),
  })
}

export function promoCodeVariables(code: string) {
  return escapeAll({
    SITE_URL: SITE.url,
    CODE: code,
    PERCENT: `${OFFER.subscriberPercent}%`,
    OFFER_LINE: OFFER.salePercent
      ? `It comes on top of our ${OFFER.saleLabel} offer of ${OFFER.salePercent}% off every pen.`
      : "Use it on any pen.",
  })
}

export function subscribeAdminVariables(email: string, at: Date) {
  return escapeAll({ SITE_URL: SITE.url, SUBSCRIBER_EMAIL: email, SUBSCRIBED_AT: utc(at) })
}
/** Turns a new-client sign-up into the new-client Resend template's variables. */
export function newClientVariables(name: string, overrides: Partial<Record<string, string>> = {}) {
  return escapeAll({
    SITE_URL: SITE.url,
    NAME: name,
    WELCOME_LINE:
      "Thank you for placing your trust in VETUD. This email introduces the two pens in our peptide series and how to order more.",
    PRODUCTS_LINE:
      "VETUD offers two precision pens for weight-management research, each boxed with 12 needles and a booklet.",
    CONTACT_LINKS: contactLinks()
      .map((link) => `${link.label}: ${link.key === "email" ? link.value : link.href}`)
      .join("\n"),
    ...overrides,
  })
}

const utc = (date: Date) => date.toISOString().replace("T", " ").slice(0, 16) + " UTC"
