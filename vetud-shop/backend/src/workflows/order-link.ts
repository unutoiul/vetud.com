import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Order links (owner, 2026-11-25): for customers who order on WhatsApp. The owner picks the items in
 * Admin > Order links; this makes an ordinary Medusa cart with them and marks it `order_link` in its
 * metadata. The customer opens /<country>/order-link?cart=<id> and finishes the normal checkout
 * (email, phone, address, delivery, payment), which sends the usual order emails: the bill to the
 * customer and the address to the owner.
 */

export type CreateOrderLinkInput = {
  country_code: string
  items: { variant_id: string; quantity: number }[]
  promo_code?: string
  customer_name?: string
  whatsapp?: string
  email?: string
  note?: string
}

/** The region that sells to the chosen country; the link opens the shop for that country. */
const findOrderLinkRegionStep = createStep(
  "find-order-link-region",
  async (input: { country_code: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "region", fields: ["id", "countries.iso_2"] })
    const regions = data as { id: string; countries?: { iso_2?: string | null }[] | null }[]
    const region = regions.find((candidate) => candidate.countries?.some((country) => country.iso_2 === input.country_code))
    if (!region) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `The shop doesn't sell to ${input.country_code.toUpperCase()}.`)
    }
    return new StepResponse({ id: region.id })
  }
)

export const createOrderLinkWorkflow = createWorkflow("create-order-link", function (input: CreateOrderLinkInput) {
  const region = findOrderLinkRegionStep({ country_code: input.country_code })

  const cartInput = transform({ input, region }, ({ input, region }) => {
    const metadata: Record<string, unknown> = {
      order_link: true,
      order_link_country: input.country_code,
      order_link_created_at: new Date().toISOString(),
    }
    if (input.customer_name) metadata.order_link_customer = input.customer_name
    if (input.whatsapp) metadata.order_link_whatsapp = input.whatsapp
    if (input.email) metadata.order_link_email = input.email
    if (input.note) metadata.order_link_note = input.note
    return {
      region_id: region.id,
      items: input.items.map((item) => ({ variant_id: item.variant_id, quantity: item.quantity })),
      ...(input.promo_code ? { promo_codes: [input.promo_code] } : {}),
      metadata,
    }
  })

  const cart = createCartWorkflow.runAsStep({ input: cartInput })
  const result = transform({ cart }, ({ cart }) => ({ cart_id: cart.id }))
  return new WorkflowResponse(result)
})
