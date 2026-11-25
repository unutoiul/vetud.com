import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import { setCartDeliveryAddressWorkflow, type CartAddressInput } from "./set-cart-delivery-address"
import { setCheckoutEmailWorkflow } from "./set-checkout-email"

/**
 * Order links (owner, 2026-11-25): for customers who order on WhatsApp. The owner picks the items in
 * Admin > Order links and, when they have them, the customer's email and delivery address. This
 * makes an ordinary Medusa cart with all of it, marked `order_link` in its metadata. The customer
 * opens /<country>/order-link?cart=<id>: with email and address on the cart, the checkout opens at
 * payment (it picks the cheapest delivery itself); without them, the customer fills them in. When the
 * owner picked a payment method, the checkout starts with it chosen; the customer can switch. Placing
 * the order sends the usual emails: the bill to the customer and the address to the owner.
 *
 * Email and address go through the checkout's own workflows (set-checkout-email,
 * set-cart-delivery-address), so the cart is exactly as if the customer had typed them.
 */

export type CreateOrderLinkInput = {
  country_code: string
  items: { variant_id: string; quantity: number }[]
  promo_code?: string
  customer_name?: string
  whatsapp?: string
  email?: string
  shipping_address?: CartAddressInput
  /** Pre-selected at checkout (stored as `order_link_payment`); the customer can still switch. */
  payment_provider?: string
  note?: string
}

type RegionRow = {
  id: string
  countries?: { iso_2?: string | null }[] | null
  payment_providers?: ({ id?: string | null; is_enabled?: boolean | null } | null)[] | null
}

/**
 * The region that sells to the chosen country; the link opens the shop for that country. A
 * pre-selected payment method must be turned on in that region, or the checkout couldn't offer it.
 */
const findOrderLinkRegionStep = createStep(
  "find-order-link-region",
  async (input: { country_code: string; payment_provider?: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "countries.iso_2", "payment_providers.id", "payment_providers.is_enabled"],
    })
    const region = (data as RegionRow[]).find((candidate) => candidate.countries?.some((country) => country.iso_2 === input.country_code))
    if (!region) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `The shop doesn't sell to ${input.country_code.toUpperCase()}.`)
    }
    if (input.payment_provider && !region.payment_providers?.some((provider) => provider?.id === input.payment_provider && provider?.is_enabled !== false)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `That payment method isn't available for ${input.country_code.toUpperCase()}. Choose another one.`)
    }
    return new StepResponse({ id: region.id })
  }
)

export const createOrderLinkWorkflow = createWorkflow("create-order-link", function (input: CreateOrderLinkInput) {
  const region = findOrderLinkRegionStep({ country_code: input.country_code, payment_provider: input.payment_provider })

  const cartInput = transform({ input, region }, ({ input, region }) => {
    const address = input.shipping_address
    const name = input.customer_name || [address?.first_name, address?.last_name].filter(Boolean).join(" ")
    const metadata: Record<string, unknown> = {
      order_link: true,
      order_link_country: input.country_code,
      order_link_created_at: new Date().toISOString(),
    }
    if (name) metadata.order_link_customer = name
    if (input.whatsapp || address?.phone) metadata.order_link_whatsapp = input.whatsapp || address?.phone
    if (input.email) metadata.order_link_email = input.email
    if (input.payment_provider) metadata.order_link_payment = input.payment_provider
    if (input.note) metadata.order_link_note = input.note
    return {
      region_id: region.id,
      items: input.items.map((item) => ({ variant_id: item.variant_id, quantity: item.quantity })),
      ...(input.promo_code ? { promo_codes: [input.promo_code] } : {}),
      metadata,
    }
  })

  const cart = createCartWorkflow.runAsStep({ input: cartInput })

  when("order-link-has-email", { input }, ({ input }) => Boolean(input.email)).then(() => {
    setCheckoutEmailWorkflow.runAsStep({
      input: transform({ input, cart }, ({ input, cart }) => ({ cart_id: cart.id, email: input.email as string })),
    })
  })

  when("order-link-has-address", { input }, ({ input }) => Boolean(input.shipping_address)).then(() => {
    setCartDeliveryAddressWorkflow.runAsStep({
      input: transform({ input, cart }, ({ input, cart }) => ({
        cart_id: cart.id,
        shipping_address: input.shipping_address as CartAddressInput,
      })),
    })
  })

  const result = transform({ cart }, ({ cart }) => ({ cart_id: cart.id }))
  return new WorkflowResponse(result)
})
