import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { stripCartBilling } from "../cart-billing"
import { StoreSetCartDeliveryAddressSchema } from "../store/carts/[id]/delivery-address/validators"

describe("delivery-only checkout", () => {
  it("ignores separate billing from legacy clients before and after native validation", () => {
    const shipping = { address_1: "Delivery street", country_code: "gb" }
    const req = {
      body: { email: "test@example.test", shipping_address: shipping, billing_address: { address_1: "Old billing street" } },
      validatedBody: { shipping_address: shipping, billing_address: "caaddr_legacy" },
    } as unknown as MedusaRequest
    const next = jest.fn()
    stripCartBilling(req, {} as MedusaResponse, next as MedusaNextFunction)
    expect(req.body).toEqual({ email: "test@example.test", shipping_address: shipping })
    expect(req.validatedBody).toEqual({ shipping_address: shipping })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it("leaves malformed requests for native validation", () => {
    const req = { body: null, validatedBody: undefined } as unknown as MedusaRequest
    const next = jest.fn()
    stripCartBilling(req, {} as MedusaResponse, next as MedusaNextFunction)
    expect(req.body).toBeNull()
    expect(next).toHaveBeenCalledWith()
  })

  it("accepts a delivery address without storing a legacy billing payload", () => {
    const shipping = { address_1: "Delivery street", country_code: "gb" }
    expect(StoreSetCartDeliveryAddressSchema.parse({ shipping_address: shipping, billing_address: shipping })).toEqual({ shipping_address: shipping })
  })
})
