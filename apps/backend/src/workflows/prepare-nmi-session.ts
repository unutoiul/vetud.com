import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

type Input = { payment_collection_id: string; customer_id?: string; data?: Record<string, unknown> }
const TOKEN_FIELDS = new Set(["payment_token", "payment_method", "account_type", "account_holder_type", "ach_authorized"])
const ADDRESS_FIELDS = ["first_name", "last_name", "company", "address_1", "address_2", "city", "province", "postal_code", "country_code", "phone"]

export function nmiCheckoutData(data: Record<string, unknown> = {}) {
  if (!data || Array.isArray(data) || typeof data !== "object" || Object.keys(data).some((key) => !TOKEN_FIELDS.has(key))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only a secure payment token and payment method may be submitted.")
  }
  if (Object.keys(data).length) {
    if (typeof data.payment_token !== "string" || !data.payment_token || data.payment_token.length > 1024 || !["card", "ach", "wallet"].includes(String(data.payment_method))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A valid payment token and method are required.")
    }
  }
  return { ...data }
}

const prepareNmiSessionStep = createStep("prepare-nmi-session", async (input: Input, { container }) => {
  const data = nmiCheckoutData(input.data)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "cart_payment_collection",
    fields: ["cart.id", "cart.email", "cart.completed_at", "cart.customer_id", "cart.customer.has_account", "cart.billing_address.*"],
    filters: { payment_collection_id: input.payment_collection_id },
  })
  const cart = links[0]?.cart
  if (!cart || cart.completed_at || (cart.customer?.has_account && cart.customer_id !== input.customer_id)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This checkout is no longer available. Sign in or start a new cart.")
  }
  const address = cart.billing_address as Record<string, unknown> | null
  if (!address?.address_1 || !address.first_name || !address.last_name || !address.city || !address.country_code) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Complete the billing address before choosing card or bank payment.")
  }
  const billing: Record<string, unknown> = { email: cart.email }
  for (const field of ADDRESS_FIELDS) {
    if (typeof address[field] === "string") billing[field] = address[field]
  }
  return new StepResponse({ ...data, billing })
})

export const prepareNmiSessionWorkflow = createWorkflow("prepare-nmi-session", (input: Input) => {
  return new WorkflowResponse(prepareNmiSessionStep(input))
})
