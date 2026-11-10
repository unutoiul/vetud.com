import { authenticate, type AuthenticatedMedusaRequest, type MedusaNextFunction, type MedusaRequest, type MedusaResponse, type MiddlewareRoute } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { PayPalModuleService } from "../lib/paypal-module"
import { validateCartOwner } from "../lib/cart-owner"
import { PAYPAL_PROVIDER_ID } from "../lib/paypal-setup"

/** Never let the browser inject provider state such as a fabricated completed capture. */
export async function preparePayPalSession(req: AuthenticatedMedusaRequest<{ provider_id: string; data?: unknown }>, _res: MedusaResponse, next: MedusaNextFunction) {
  if (req.body?.provider_id !== PAYPAL_PROVIDER_ID) return next()
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "cart_payment_collection", fields: ["cart.id", "cart.customer_id"], filters: { payment_collection_id: req.params.id } })
    const cart = data[0]?.cart
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Checkout cart not found.")
    validateCartOwner(cart, req.auth_context?.actor_id)
    req.body.data = {}
    req.validatedBody = req.body
    next()
  } catch (error) { next(error) }
}

/** A production checkout must never offer a sandbox account or a disconnected wallet. */
export async function requirePayPalAvailable(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const paypal = req.scope.resolve<PayPalModuleService>("paypal_onboarding")
    const { environment } = await paypal.getActiveCredentials()
    const { data } = await paypal.getSettings()
    if ((process.env.NODE_ENV === "production" && environment !== "live") || data?.paypal_settings?.enabled === false) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "PayPal is not enabled for this checkout.")
    }
    next()
  } catch {
    next(new MedusaError(MedusaError.Types.NOT_ALLOWED, "PayPal is currently unavailable. Please choose another payment method."))
  }
}

/** Apply the store's signed-in owner policy to the plugin's additional checkout routes. */
export async function requirePayPalCart(req: AuthenticatedMedusaRequest<{ cart_id?: string; order_id?: string; is_card_payment?: boolean }>, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    if (typeof req.body?.cart_id !== "string" || !/^cart_[a-zA-Z0-9_]+$/.test(req.body.cart_id) || req.body.is_card_payment || (req.body.order_id !== undefined && (typeof req.body.order_id !== "string" || !/^[A-Z0-9]{10,25}$/.test(req.body.order_id)))) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A PayPal wallet checkout cart is required.")
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "customer_id", "total", "currency_code", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.data"],
      filters: { id: req.body.cart_id },
    })
    const cart = data[0]
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Checkout cart not found.")
    validateCartOwner(cart, req.auth_context?.actor_id)
    const session = cart.payment_collection?.payment_sessions?.find(candidate => candidate?.provider_id === PAYPAL_PROVIDER_ID)
    if (!session) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Select PayPal in checkout before paying.")
    if (req.body.order_id) {
      const stored = session.data?.paypal as { order_id?: string } | undefined
      if (stored?.order_id !== req.body.order_id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This PayPal payment does not match your checkout.")
      const paypal = req.scope.resolve<PayPalModuleService>("paypal_onboarding")
      const order = await paypal.getOrderDetails(req.body.order_id)
      const units = order.purchase_units
      const amount = units?.[0]?.amount
      // Recheck with PayPal immediately before capture: a changed cart must not charge a stale total.
      if (units?.length !== 1 || amount?.currency_code?.toLowerCase() !== cart.currency_code || Number(amount?.value) !== Number(cart.total) || !(Number(cart.total) > 0)) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your total changed. Review checkout and approve a new PayPal payment.")
      }
    }
    next()
  } catch (error) { next(error) }
}

export const paypalGuardRoutes: MiddlewareRoute[] = [
  { matcher: "/store/paypal/config", method: ["GET"], middlewares: [requirePayPalAvailable] },
  ...["/store/paypal/create-order", "/store/paypal/capture-order", "/store/paypal-complete"].map(matcher => ({
    matcher,
    method: ["POST"] as ["POST"],
    middlewares: [authenticate("customer", ["session", "bearer"]), requirePayPalAvailable, requirePayPalCart],
  })),
]
