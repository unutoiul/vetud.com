import { NextResponse, type NextRequest } from "next/server"
import { CONTACTS } from "@/config/site"
import { saveSubscriberRow } from "@/lib/db"
import { saveSubscriber, sendTemplate } from "@/lib/email/send"
import { promoCodeVariables, subscribeAdminVariables } from "@/lib/email/templates"
import { EMAIL_PATTERN, LIMITS } from "@/lib/order"
import { promoCode } from "@/lib/promo"
import { limited } from "@/lib/rate-limit"

/**
 * The "extra 10%" pop-up: saves the subscriber in Supabase (table `subscribers`) and as a Resend
 * contact, emails them the code, tells the owner, and returns the code so it can be shown (and
 * applied) straight away.
 */
export async function POST(request: NextRequest) {
  if (limited(request, "subscribe", 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 })
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown; country?: unknown; website?: unknown } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, LIMITS.email) : ""
  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 })

  // The visitor's country on the page (two letters), for the list; anything else is dropped.
  const country = typeof body?.country === "string" && /^[A-Z]{2}$/.test(body.country) ? body.country : null
  const code = promoCode()
  // Bots fill the hidden field: answer as usual, store and send nothing.
  if (typeof body?.website === "string" && body.website) return NextResponse.json({ code })

  const owner = process.env.STORE_OWNER_EMAIL || CONTACTS.email
  const results = await Promise.allSettled([
    saveSubscriberRow(email, country),
    saveSubscriber(email),
    sendTemplate({ template: "promo-code", to: email, variables: promoCodeVariables(code), replyTo: owner }),
    sendTemplate({ template: "subscribe-admin", to: owner, variables: subscribeAdminVariables(email, new Date()), replyTo: email }),
  ])
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`[subscribe ${email}] step ${index} failed`, result.reason)
  })
  return NextResponse.json({ code })
}
