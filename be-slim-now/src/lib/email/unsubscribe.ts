import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { SITE } from "@/config/site"

/**
 * Signed unsubscribe links for the emails (owner request 2026-11-28), so nobody can unsubscribe
 * someone else. The key is BESLIMNOW_API_SECRET, which this site already has; without it there is no
 * link and the email's "Unsubscribe" opens an email to us instead (the template's fallback).
 */
function sign(email: string) {
  const secret = process.env.BESLIMNOW_API_SECRET
  if (!secret) return null
  return createHmac("sha256", secret).update(`beslimnow:unsubscribe:${email.trim().toLowerCase()}`).digest("base64url")
}

export function unsubscribeUrl(email: string) {
  const token = sign(email)
  if (!token) return undefined
  return `${SITE.url}/unsubscribe?${new URLSearchParams({ email: email.trim().toLowerCase(), token })}`
}

export function isValidUnsubscribeToken(email: string, token: string) {
  const expected = sign(email)
  if (!expected) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}
