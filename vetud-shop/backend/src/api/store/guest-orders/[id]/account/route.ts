import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { normalizeEmail, SIGN_IN_PROVIDER } from "../../../../../lib/sign-in-code"
import { attachGuestOrderWorkflow, findGuestOrderWorkflow } from "../../../../../workflows/guest-order-account"
import { StoreGuestOrderAccountSchema, type StoreGuestOrderAccountBody } from "./validators"

/**
 * POST /store/guest-orders/:id/account: after ordering as a guest, keep the order in an account.
 * The shopper first signs in with the code emailed to the order's address. A member (signed in)
 * gets the order added to their account; someone signing in for the first time (a code login with no
 * account yet) gets an account made from that login, with the order in it. The proof that this
 * browser placed the order is the order's cart id, which only the checkout knows; it works for 24 hours.
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreGuestOrderAccountBody>, res: MedusaResponse) {
  const { cart_id } = req.validatedBody
  const customerId = req.auth_context?.actor_id || undefined
  const input = { order_id: req.params.id, cart_id, customer_id: customerId }
  const { result: order } = await findGuestOrderWorkflow(req.scope).run({ input })

  let authIdentityId: string | undefined
  if (!order.target_customer_id) {
    // A first sign-in: the code login must be for this order's email.
    authIdentityId = req.auth_context?.auth_identity_id || undefined
    if (!authIdentityId || customerId) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in with the code we email you to keep this order in an account.")
    }
    const [login] = await req.scope.resolve(Modules.AUTH).listProviderIdentities({ auth_identity_id: authIdentityId, provider: SIGN_IN_PROVIDER })
    if (!login || login.entity_id !== normalizeEmail(order.email)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Sign in with the email used for this order to keep it in an account.")
    }
  }

  const { result } = await attachGuestOrderWorkflow(req.scope).run({ input: { ...input, auth_identity_id: authIdentityId } })
  res.json(result)
}

/**
 * GET /store/guest-orders/:id/account?cart_id=…: whether this order is already in an account. An
 * order placed with a member's email without signing in is filed in that account when it's placed,
 * so the confirmation page says so instead of offering to create one. Same proof as above.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = StoreGuestOrderAccountSchema.safeParse({ cart_id: req.query.cart_id })
  if (!parsed.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart_id is required.")
  const { data } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "order",
    fields: ["id", "cart.id", "customer.has_account"],
    filters: { id: req.params.id },
  })
  const order = data[0] as { cart?: { id: string } | null; customer?: { has_account?: boolean | null } | null } | undefined
  if (!order?.cart?.id || order.cart.id !== parsed.data.cart_id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "We couldn't find this order from this browser.")
  }
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ in_account: order.customer?.has_account === true })
}
