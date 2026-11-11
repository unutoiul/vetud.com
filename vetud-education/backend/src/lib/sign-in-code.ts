import { createHmac, randomInt, timingSafeEqual } from "node:crypto"

/**
 * Members sign in with their email and password, then a 6-digit code sent to that email.
 * The code is checked by the `email` MFA provider (src/modules/email-mfa) through Medusa's
 * built-in MFA challenge, which also limits attempts and issues the real sign-in token.
 */
export const SIGN_IN_CODE_METHOD = "email"
export const SIGN_IN_CODE_TTL_MINUTES = 10
export const SIGN_IN_CODE_RESEND_SECONDS = 30
export const SIGN_IN_CODE_MAX_ATTEMPTS = 5

export function newSignInCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

/**
 * Only the hash is stored. It's keyed with a server secret, so nobody outside this backend can
 * plant a code they know, even through Medusa's own MFA routes.
 */
export function hashSignInCode(secret: string, authIdentityId: string, code: string) {
  return createHmac("sha256", secret).update(`${authIdentityId}:${code}`).digest("hex")
}

export function sameSignInCodeHash(a: string, b: string) {
  const left = Buffer.from(a, "hex")
  const right = Buffer.from(b, "hex")
  return left.length === 32 && right.length === 32 && timingSafeEqual(left, right)
}

/** "a***@example.com", so the page can say where the code went without showing the whole address. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  if (!name || !domain) return email
  return `${name[0]}${"*".repeat(Math.max(2, Math.min(name.length - 1, 6)))}@${domain}`
}
