/**
 * A guest can't check out with the email of a member account: the member signs in instead, so the
 * order lands in their account (owner request 2026-11-18). Medusa's own sign-up already tells
 * anyone whether an email has an account, so saying so here reveals nothing new.
 */
export const ACCOUNT_EXISTS_MESSAGE = "An account already uses this email. Sign in to continue, or use a different email."

/** Escapes a value for an exact, case-insensitive ILIKE match. */
export function exactIlike(value: string) {
  return value.trim().replace(/[\\%_]/g, (char) => `\\${char}`)
}

type Query = {
  graph: (config: { entity: string; fields: string[]; filters: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

/** The ids of member accounts (not Medusa's guest records) registered with this email, in any letter case. */
export async function memberIdsForEmail(query: Query, email: string) {
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email: { $ilike: exactIlike(email) }, has_account: true },
  })
  return (data as { id: string }[]).map((customer) => customer.id)
}

/** True when the email belongs to a member account other than the signed-in shopper's. */
export function emailNeedsSignIn(memberIds: string[], signedInCustomerId?: string | null) {
  return memberIds.length > 0 && !(signedInCustomerId && memberIds.includes(signedInCustomerId))
}
