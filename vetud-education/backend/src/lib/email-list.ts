import { createHmac, timingSafeEqual } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

/** Every language the education site is published in (frontend src/i18n/languages.ts). */
export const LIST_LOCALES = ["en", "es", "pt", "fr", "de", "it", "nl", "pl"] as const
export type ListLocale = (typeof LIST_LOCALES)[number]

/**
 * What the visitor agreed to by entering their email and pressing the sign-up button (there is no
 * tick box), stored with their consent. Change the version when the wording changes.
 */
export const CONSENT_VERSION = "2026-11-24"
export const CONSENT_TEXT: { en: string } & Partial<Record<ListLocale, string>> = {
  en: "Signed up with the VETUD email list form to get new guides and answered community questions by email. Free to join; unsubscribe whenever you like.",
  fr: "Inscription via le formulaire de la liste e-mail VETUD pour recevoir par e-mail les nouveaux guides et les questions de la communauté ayant reçu une réponse. Gratuit ; désinscription possible à tout moment.",
}

/** The wording stored with a sign-up; languages without their own wording keep the English one. */
export const consentText = (locale: ListLocale) => CONSENT_TEXT[locale] ?? CONSENT_TEXT.en

/** Custom event emitted when a pending sign-up is confirmed; it emails the owner. */
export const EMAIL_LIST_CONFIRMED_EVENT = "email_list.confirmed"

export type EmailListConfirmedEvent = {
  id: string
  email: string
  locale: string
  consented_at: string
  confirmed_at: string
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
