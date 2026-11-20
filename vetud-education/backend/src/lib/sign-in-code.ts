import { createHmac, randomInt, timingSafeEqual } from "node:crypto"

/**
 * Members have no passwords (owner, 2026-11-19): they type their email, we email a 6-digit code,
 * and the code signs them in for 30 days. The first sign-in creates the account. Admin users still
 * sign in with a password.
 *
 * The code's state lives on the customer's `email-code` login (its provider_metadata), hashed with
 * the server secret, so nobody can plant a code they know.
 */
export const SIGN_IN_PROVIDER = "email-code"
export const SIGN_IN_CODE_TTL_MINUTES = 10
export const SIGN_IN_CODE_RESEND_SECONDS = 30
export const SIGN_IN_CODE_MAX_ATTEMPTS = 5
/** How long a sign-in lasts (http.jwtExpiresIn in medusa-config). */
export const SIGN_IN_SESSION = "30d"

export type SignInCodeState = {
  code_hash?: string | null
  expires_at?: string | null
  attempts?: number
  sent_at?: string | null
}

export type SignInCodeCheck = "ok" | "wrong" | "expired" | "locked"

export const SIGN_IN_CODE_ERRORS: Record<Exclude<SignInCodeCheck, "ok">, string> = {
  wrong: "That code isn't right. Check the email we sent and try again.",
  expired: "That code has expired. Ask for a new one.",
  locked: "Too many wrong codes. Ask for a new one.",
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function newSignInCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

function secret() {
  // The same secret Medusa signs its tokens with (its own default when unset, in development).
  return process.env.JWT_SECRET || "supersecret"
}

/** Bound to one login, so a code can't be reused for another address. */
export function hashSignInCode(loginId: string, code: string) {
  return createHmac("sha256", secret()).update(`${loginId}:${code}`).digest("hex")
}

function sameHash(a: string, b: string) {
  const left = Buffer.from(a, "hex")
  const right = Buffer.from(b, "hex")
  return left.length === 32 && right.length === 32 && timingSafeEqual(left, right)
}

/** Checks a typed code against the stored state. Spaces and dashes in what was typed are ignored. */
export function checkSignInCode(state: SignInCodeState | null | undefined, loginId: string, code: string, now = new Date()): SignInCodeCheck {
  if (!state?.code_hash || !state.expires_at || new Date(state.expires_at).getTime() <= now.getTime()) return "expired"
  if ((state.attempts ?? 0) >= SIGN_IN_CODE_MAX_ATTEMPTS) return "locked"
  const typed = String(code).replace(/[\s-]/g, "")
  if (!/^\d{6}$/.test(typed)) return "wrong"
  return sameHash(state.code_hash, hashSignInCode(loginId, typed)) ? "ok" : "wrong"
}

/** Seconds until another code may be sent to this login (0 when it can be sent now). */
export function secondsUntilResend(state: SignInCodeState | null | undefined, now = new Date()) {
  if (!state?.sent_at) return 0
  const wait = new Date(state.sent_at).getTime() + SIGN_IN_CODE_RESEND_SECONDS * 1000 - now.getTime()
  return wait > 0 ? Math.ceil(wait / 1000) : 0
}

/** A fresh code's state, and the code itself to email. */
export function issueSignInCode(loginId: string, now = new Date()) {
  const code = newSignInCode()
  const state: SignInCodeState = {
    code_hash: hashSignInCode(loginId, code),
    expires_at: new Date(now.getTime() + SIGN_IN_CODE_TTL_MINUTES * 60_000).toISOString(),
    attempts: 0,
    sent_at: now.toISOString(),
  }
  return { code, state }
}
