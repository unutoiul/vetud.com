import { NextResponse, type NextRequest } from "next/server"
import { unsubscribeContact } from "@/lib/email/send"
import { isValidUnsubscribeToken } from "@/lib/email/unsubscribe"
import { EMAIL_PATTERN, LIMITS } from "@/lib/order"
import { limited } from "@/lib/rate-limit"

/**
 * The button on /unsubscribe (the link at the bottom of every customer email): marks the address as
 * unsubscribed in Resend, so broadcasts no longer reach it. The link is signed, so nobody can
 * unsubscribe someone else.
 */
export async function POST(request: NextRequest) {
  if (limited(request, "unsubscribe", 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 })
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown; token?: unknown } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, LIMITS.email) : ""
  const token = typeof body?.token === "string" ? body.token.slice(0, 200) : ""
  if (!EMAIL_PATTERN.test(email) || !isValidUnsubscribeToken(email, token)) {
    return NextResponse.json(
      { error: "This link isn't valid. Please use the link from your latest email." },
      { status: 400 },
    )
  }
  try {
    await unsubscribeContact(email)
  } catch (error) {
    console.error(`[unsubscribe ${email}] failed`, error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
