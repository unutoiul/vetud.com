import { randomInt } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { CONTACTS } from "@/config/site"
import { saveOrderRow } from "@/lib/db"
import { sendTemplate } from "@/lib/email/send"
import { adminVariables, confirmationVariables } from "@/lib/email/templates"
import { orderTotal, parseOrder } from "@/lib/order"
import { currencyOf, pricingCountry } from "@/lib/pricing"
import { isPromoCode } from "@/lib/promo"
import { limited } from "@/lib/rate-limit"

/**
 * One way to order: the form posts here, the order is saved in Supabase (table `orders`), the buyer
 * gets a confirmation with payment details and the owner gets an alert.
 */

function orderNumber(date: Date) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "")
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const suffix = Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("")
  return `VP-${stamp}-${suffix}`
}

export async function POST(request: NextRequest) {
  if (limited(request, "order", 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many orders from this connection. Please message us instead." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = parseOrder(body)
  if (!parsed.ok) return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.errors }, { status: 400 })
  const { order } = parsed

  const withCode = isPromoCode(order.promoCode)
  if (order.promoCode && !withCode) {
    return NextResponse.json({ error: "That discount code isn't valid.", fields: { promoCode: "This code isn't valid." } }, { status: 400 })
  }

  const placedAt = new Date()
  const number = orderNumber(placedAt)

  // Bots fill every field. Pretend it worked and send nothing.
  if (order.website) return NextResponse.json({ orderNumber: number })

  // Priced for the country it ships to, exactly as the form showed it.
  const amounts = orderTotal(order.product, order.strength, order.quantity, withCode, order.country)
  const { total } = amounts
  const currency = currencyOf(pricingCountry(order.country))

  const owner = process.env.STORE_OWNER_EMAIL || CONTACTS.email
  const [buyer, admin] = await Promise.allSettled([
    sendTemplate({ template: "order-confirmation", to: order.email, variables: confirmationVariables(order, number, withCode), replyTo: owner }),
    sendTemplate({ template: "order-admin", to: owner, variables: adminVariables(order, number, placedAt, withCode), replyTo: order.email }),
  ])
  if (admin.status === "rejected") console.error(`[order ${number}] owner alert failed`, admin.reason)

  // Saved even when the buyer's email failed (confirmation_sent false), so no order is lost. A
  // database problem never blocks the order: the owner alert still has every detail.
  try {
    await saveOrderRow({
      order_number: number,
      placed_at: placedAt.toISOString(),
      product: order.product,
      strength: order.strength,
      quantity: order.quantity,
      currency,
      unit_regular: amounts.regular,
      unit_price: amounts.unit,
      regular_total: amounts.regularTotal,
      subtotal: amounts.subtotal,
      code_discount: amounts.codeDiscount,
      total,
      promo_code: withCode ? order.promoCode.toUpperCase() : null,
      name: order.name,
      email: order.email,
      phone: order.phone,
      contact_app: order.contactApp,
      contact_handle: order.contactHandle || null,
      country: order.country,
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      note: order.note || null,
      research_use_confirmed: true,
      confirmation_sent: buyer.status === "fulfilled",
    })
  } catch (error) {
    console.error(`[order ${number}] saving to the database failed`, error)
  }

  if (buyer.status === "rejected") {
    console.error(`[order ${number}] buyer confirmation failed`, buyer.reason)
    return NextResponse.json(
      { error: "We couldn't send your confirmation email. Please check the address, or message us to finish your order." },
      { status: 502 },
    )
  }

  console.info(`[order ${number}] ${order.quantity} × ${order.product} ${order.strength} to ${order.country}${withCode ? " +code" : ""} = ${total} ${currency}`)
  return NextResponse.json({ orderNumber: number, total, currency })
}
