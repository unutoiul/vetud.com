import type { MedusaContainer, OrderDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { projectCustomerOrders } from "../list-customer-orders"
import { NMI_PROVIDER_ID } from "../../lib/nmi-settlement"

it("reads fresh payment rows only for the scoped page, then drops every internal relation", async () => {
  const listPayments = jest.fn(async () => [{ id: "pay_nmi", provider_id: NMI_PROVIDER_ID, data: { token: "private" }, metadata: { private: true } }])
  const container = { resolve: jest.fn((key: string) => {
    expect(key).toBe(Modules.PAYMENT)
    return { listPayments }
  }) } as unknown as MedusaContainer
  const orders = [
    { id: "order_nmi", payment_status: "captured", payment_collections: [{ payments: [{ id: "pay_nmi", provider_id: NMI_PROVIDER_ID, data: { secret: "private" } }] }] },
    { id: "order_crypto", payment_status: "captured", payment_collections: [{ payments: [{ id: "pay_crypto", provider_id: "pp_makepay_makepay", data: { secret: "private" } }] }] },
  ] as unknown as OrderDTO[]
  const result = await projectCustomerOrders(orders, container)
  expect(listPayments).toHaveBeenCalledWith({ id: ["pay_nmi"] }, { relations: ["payment_session"], take: 1 })
  expect(result).toEqual([
    { id: "order_nmi", payment_status: "captured", payment_summary: { method: "unknown", review: "requires_review" } },
    { id: "order_crypto", payment_status: "captured", payment_summary: { method: "online" } },
  ])
  expect(JSON.stringify(result)).not.toMatch(/private|token|metadata|payment_collections/)
})

it("does not query the payment module for an empty or non-NMI page", async () => {
  const resolve = jest.fn()
  const container = { resolve } as unknown as MedusaContainer
  await expect(projectCustomerOrders([], container)).resolves.toEqual([])
  await expect(projectCustomerOrders([{ id: "order_manual", payment_collections: [{ payments: [{ id: "pay_manual", provider_id: "pp_system_default" }] }] }] as unknown as OrderDTO[], container))
    .resolves.toEqual([{ id: "order_manual", payment_summary: { method: "manual" } }])
  expect(resolve).not.toHaveBeenCalled()
})

it("does not substitute a reassuring status when the payment lookup fails", async () => {
  const container = { resolve: () => ({ listPayments: async () => { throw new Error("unavailable") } }) } as unknown as MedusaContainer
  const order = { id: "order_nmi", payment_collections: [{ payments: [{ id: "pay_nmi", provider_id: NMI_PROVIDER_ID }] }] } as unknown as OrderDTO
  await expect(projectCustomerOrders([order], container)).rejects.toThrow("unavailable")
})
