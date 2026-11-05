import { MedusaError } from "@medusajs/framework/utils"
import { listDeliveryCountries } from "../lib/delivery-countries"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, refreshCartItemsWorkflow, releaseLockStep, updateCartsStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

export type CartAddressInput = {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code: string
  phone?: string
  metadata?: Record<string, unknown>
}

export type SetCartDeliveryAddressInput = {
  cart_id: string
  shipping_address: CartAddressInput
  billing_address?: CartAddressInput
}

/**
 * The delivery country must be one a delivery zone covers (since 2026-11-06 every country). Unlike
 * Medusa's own cart update, it doesn't have to be in the cart's region: the region only sets the
 * currency the shopper chose. A billing address can be anywhere.
 */
const validateDeliveryCountryStep = createStep(
  "validate-delivery-country",
  async ({ input, cart }: { input: SetCartDeliveryAddressInput; cart: { completed_at?: Date | string | null } }, { container }) => {
    if (cart.completed_at) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart has already been ordered.")
    const delivered = new Set(await listDeliveryCountries(container))
    const country = input.shipping_address.country_code.toLowerCase()
    if (!delivered.has(country)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `We don't deliver to ${country.toUpperCase()}.`)
    return new StepResponse(undefined)
  }
)

/**
 * Sets the delivery and billing addresses of a cart for any country the store sells to, keeping
 * the cart's currency (owner's choice, 2026-11-05: the currency doesn't depend on the country).
 * Otherwise it follows Medusa's cart update: one change at a time per cart, then prices, taxes,
 * promotions and shipping methods are refreshed for the new address.
 */
export const setCartDeliveryAddressWorkflow = createWorkflow(
  "set-cart-delivery-address",
  function (input: SetCartDeliveryAddressInput) {
    acquireLockStep({ key: input.cart_id, timeout: 2, ttl: 10 })
    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "completed_at"],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true, isList: false },
    })
    validateDeliveryCountryStep({ input, cart })
    const update = transform({ input }, ({ input }) => [{
      id: input.cart_id,
      shipping_address: { ...input.shipping_address, country_code: input.shipping_address.country_code.toLowerCase() },
      ...(input.billing_address ? { billing_address: { ...input.billing_address, country_code: input.billing_address.country_code.toLowerCase() } } : {}),
    }])
    updateCartsStep(update)
    refreshCartItemsWorkflow.runAsStep({ input: transform({ input }, ({ input }) => ({ cart_id: input.cart_id, force_refresh: true })) })
    releaseLockStep({ key: input.cart_id })
    return new WorkflowResponse(undefined)
  }
)
