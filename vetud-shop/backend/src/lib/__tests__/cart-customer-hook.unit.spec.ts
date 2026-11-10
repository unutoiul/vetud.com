import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { transferCartCustomerWorkflow } from "@medusajs/medusa/core-flows"

jest.mock("@medusajs/medusa/core-flows", () => ({
  transferCartCustomerWorkflow: { hooks: { validate: jest.fn() } },
}))

import "../../workflows/hooks/validate-cart-customer"

describe("cart customer hook runtime", () => {
  const callback = (transferCartCustomerWorkflow.hooks.validate as jest.Mock).mock.calls[0][0]

  it("executes directly without trying to compose a step at runtime", async () => {
    await expect(callback({ cart: {}, input: { customer_id: "cus_A" } })).resolves.toBeInstanceOf(StepResponse)
    await expect(callback({ cart: { customer_id: "cus_A", customer: { has_account: true } }, input: { customer_id: "cus_A" } })).resolves.toBeInstanceOf(StepResponse)
  })

  it("rejects a different registered owner at runtime", async () => {
    await expect(callback({ cart: { customer_id: "cus_B", customer: { has_account: true } }, input: { customer_id: "cus_A" } })).rejects.toThrow("another account")
  })

  it.each([undefined, null, {}, { has_account: undefined }])("fails closed when a linked owner's relation is incomplete (%p)", async (customer) => {
    await expect(callback({ cart: { customer_id: "cus_B", customer }, input: { customer_id: "cus_A" } })).rejects.toThrow("another account")
  })

  it("still permits a verified guest and the same owner without a relation", async () => {
    await expect(callback({ cart: { customer_id: "guest", customer: { has_account: false } }, input: { customer_id: "cus_A" } })).resolves.toBeInstanceOf(StepResponse)
    await expect(callback({ cart: { customer_id: "cus_A" }, input: { customer_id: "cus_A" } })).resolves.toBeInstanceOf(StepResponse)
  })

  it("rejects missing carts and blank caller identities", async () => {
    await expect(callback({ cart: undefined, input: { customer_id: "cus_A" } })).rejects.toThrow("another account")
    await expect(callback({ cart: {}, input: { customer_id: "  " } })).rejects.toThrow("another account")
  })
})
