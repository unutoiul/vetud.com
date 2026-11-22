import { NextResponse, type NextRequest } from "next/server"
import { OFFER } from "@/config/site"
import { isPromoCode } from "@/lib/promo"
import { limited } from "@/lib/rate-limit"

/** Checks a discount code typed in the order form, without revealing the real one. */
export async function POST(request: NextRequest) {
  if (limited(request, "promo", 20, 10 * 60 * 1000)) return NextResponse.json({ valid: false }, { status: 429 })
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null
  const code = typeof body?.code === "string" ? body.code.slice(0, 32) : ""
  return NextResponse.json(isPromoCode(code) ? { valid: true, percent: OFFER.subscriberPercent } : { valid: false })
}
