import { createHmac, timingSafeEqual } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export const LIST_LOCALES = ["en", "fr"] as const
export type ListLocale = (typeof LIST_LOCALES)[number]

/** The exact wording the visitor ticked, stored with their consent. Change the version when the wording changes. */
export const CONSENT_VERSION = "2026-11"
export const CONSENT_TEXT: Record<ListLocale, string> = {
  en: "Yes, email me new VETUD guides and answered community questions. I can unsubscribe at any time.",
  fr: "Oui, envoyez-moi par e-mail les nouveaux guides VETUD et les questions de la communauté ayant reçu une réponse. Je peux me désinscrire à tout moment.",
}

/** How long a confirmation link keeps working. */
export const CONFIRM_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

function secret() {
  const value = process.env.JWT_SECRET
  if (!value) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "JWT_SECRET is not set.")
  return value
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url")

function matches(expected: string, given: string) {
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Signed tokens, so links can't be forged for someone else's address. */
export function confirmToken(email: string, expires: number) {
  return sign(`email-list:confirm:${normalizeEmail(email)}:${expires}`)
}

export function isValidConfirmToken(email: string, expires: number, token: string, now = Date.now()) {
  return expires > now && matches(confirmToken(email, expires), token)
}

export function unsubscribeToken(email: string) {
  return sign(`email-list:unsubscribe:${normalizeEmail(email)}`)
}

export function isValidUnsubscribeToken(email: string, token: string) {
  return matches(unsubscribeToken(email), token)
}
