import type { MedusaContainer } from "@medusajs/framework/types"
import { BigNumber, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { CallbackToken } from "paygate-to"
import { getPaygateConfig, isPaygate, PAYGATE_CARD, PAYGATE_CRYPTO, paygateError } from "../lib/paygate-config"
import { decimal, readPaygate } from "../lib/paygate-state"

type Input = { session_id: string; token: string }

/** A signed capability opens only its existing, unpaid order's hosted invoice. */
export async function paygateCheckout(input: Input, container: MedusaContainer) {
  const config = getPaygateConfig()
  if (!config.enabled || !/^[a-f0-9]{64}$/.test(input.token)) paygateError("This payment link is unavailable.")
  const session = await container.resolve(Modules.PAYMENT).retrievePaymentSession(input.session_id)
  if (!isPaygate(session.provider_id)) paygateError("Invalid PayGate payment session.")
  const state = readPaygate(session.data, config.secret)
  if (state.session_id !== session.id || !new CallbackToken(config.secret).verify(`redirect:${state.reference}`, input.token)) paygateError("Invalid payment link.")
  if (state.canceled || state.settled || state.review || ["canceled", "error", "authorized"].includes(session.status)) paygateError("This payment needs review or has already been completed. Check your order before paying again.")
  if (session.provider_id !== (state.mode === "card" ? PAYGATE_CARD : PAYGATE_CRYPTO) || !decimal(state.amount).eq(new BigNumber(session.amount).bigNumber!) || state.currency.toLowerCase() !== session.currency_code.toLowerCase()) paygateError("This payment invoice has changed.")
  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "order_cart", fields: ["order.id", "order.status", "order.total", "order.currency_code", "order.payment_collections.id"], filters: { cart_id: state.cart_id } })
  const order = data[0]?.order
  if (!order || order.status === "canceled" || !order.payment_collections?.some(collection => collection?.id === session.payment_collection_id) || !decimal(state.amount).eq(new BigNumber(order.total).bigNumber!) || order.currency_code.toLowerCase() !== state.currency.toLowerCase()) paygateError("The order is unavailable or its payment total changed.")
  const url = new URL(state.checkout_url)
  if (url.protocol !== "https:" || url.host !== config.checkoutDomain || url.username || url.password) paygateError("Unexpected PayGate checkout address.")
  return { url: url.href }
}

const paygateCheckoutStep = createStep("paygate-checkout", async (input: Input, { container }) => new StepResponse(await paygateCheckout(input, container)))
export const paygateCheckoutWorkflow = createWorkflow("paygate-checkout", function (input: Input) {
  return new WorkflowResponse(paygateCheckoutStep(input))
})
