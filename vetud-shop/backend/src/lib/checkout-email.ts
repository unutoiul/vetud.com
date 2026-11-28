/**
 * Any email can place an order (owner, 2026-11-20). A member's email goes on a guest record at
 * the checkout's email step (workflows/set-checkout-email.ts) and the order is filed in the account
 * when it's placed. Medusa's own cart update would link the cart to the member instead, so it is
 * refused for another member's email (api/checkout-email-guard.ts).
 */
export const MEMBER_EMAIL_MESSAGE = "Use the checkout's email step for this email."

/** Escapes a value for an exact, case-insensitive ILIKE match. */
export function exactIlike(value: string) {
  return value.trim().replace(/[\\%_]/g, (char) => `\\${char}`)
}

type Query = {
  graph: (config: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
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
export function isAnotherMembersEmail(memberIds: string[], signedInCustomerId?: string | null) {
  return memberIds.length > 0 && !(signedInCustomerId && memberIds.includes(signedInCustomerId))
}
