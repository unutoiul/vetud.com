import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { transferCartCustomerWorkflow } from "@medusajs/medusa/core-flows"
import { executeCustomerCartTransfer } from "../../workflows/transfer-customer-cart"

jest.mock("@medusajs/medusa/core-flows", () => ({ transferCartCustomerWorkflow: jest.fn() }))

it("validates a fresh owner inside the lock before a competing transfer", async () => {
  let owner: string | null = null
  let locked = false
  let tail = Promise.resolve()
  const locking = {
    execute: jest.fn((_key: string, task: () => Promise<unknown>) => {
      const next = tail.then(async () => {
        locked = true
        try { return await task() } finally { locked = false }
      })
      tail = next.then(() => undefined, () => undefined)
      return next
    }),
  }
  const query = { graph: jest.fn(async () => {
    expect(locked).toBe(true)
    return { data: [{ id: "cart_test", customer_id: owner, customer: { has_account: Boolean(owner) } }] }
  }) }
  const run = jest.fn(async ({ input }: { input: { customer_id: string } }) => {
    expect(locked).toBe(true)
    owner = input.customer_id
  })
  const transfer = transferCartCustomerWorkflow as unknown as jest.Mock
  transfer.mockReturnValue({ run })
  const container = { resolve: (key: string) => key === Modules.LOCKING ? locking : key === ContainerRegistrationKeys.QUERY ? query : null } as unknown as MedusaContainer

  const results = await Promise.allSettled([
    executeCustomerCartTransfer({ cart_id: "cart_test", customer_id: "cus_A", fields: ["id"] }, container),
    executeCustomerCartTransfer({ cart_id: "cart_test", customer_id: "cus_B", fields: ["id"] }, container),
  ])
  expect(results[0].status).toBe("fulfilled")
  expect(results[1].status).toBe("rejected")
  expect(owner).toBe("cus_A")
  expect(run).toHaveBeenCalledTimes(1)
  await expect(executeCustomerCartTransfer({ cart_id: "cart_test", customer_id: "cus_A", fields: ["id"] }, container)).resolves.toBeDefined()
})
