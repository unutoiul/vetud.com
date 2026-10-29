import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { CallbackToken } from "paygate-to"
import { getPaygateConfig, isPaygate, paygateError } from "../../../../lib/paygate-config"
import { readPaygate } from "../../../../lib/paygate-state"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Referrer-Policy", "no-referrer")
  const config = getPaygateConfig()
  if (!config.enabled) paygateError("PayGate is disabled.")
  const session = await req.scope.resolve(Modules.PAYMENT).retrievePaymentSession(req.params.id)
  const state = readPaygate(session.data, config.secret)
  if (!isPaygate(session.provider_id) || session.status !== "pending_authorization" || state.session_id !== session.id || state.canceled || state.settled || !new CallbackToken(config.secret).verify(`redirect:${state.reference}`, typeof req.query.token === "string" ? req.query.token : "")) paygateError("This checkout link is no longer available.")
  const url = new URL(state.checkout_url)
  const { data: orders } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "order_cart", fields: ["order.id", "order.status"], filters: { cart_id: state.cart_id } })
  if (!orders[0]?.order || orders[0].order.status === "canceled") paygateError("This order is not available for payment.")
  if (url.origin !== `https://${config.checkoutDomain}` || !["/pay.php", "/crypto/hosted.php"].includes(url.pathname)) paygateError("Invalid PayGate checkout destination.")
  res.redirect(303, url.href)
}
