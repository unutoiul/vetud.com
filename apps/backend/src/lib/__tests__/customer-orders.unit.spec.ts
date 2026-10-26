import type { OrderDTO } from "@medusajs/framework/types"
import { customerOrderQuery, publicCustomerOrder } from "../customer-orders"
import { CustomerOrderQuery, CustomerOrdersQuery } from "../../api/store/account/orders/validators"
import { validateCartOwnership } from "../cart-ownership"

describe("customer order history", () => {
  it("links guest carts but refuses another registered customer's cart", () => {
    expect(() => validateCartOwnership({}, "cus_A")).not.toThrow()
    expect(() => validateCartOwnership({ customer_id: "guest", customer: { has_account: false } }, "cus_A")).not.toThrow()
    expect(() => validateCartOwnership({ customer_id: "cus_A", customer: { has_account: true } }, "cus_A")).not.toThrow()
    expect(() => validateCartOwnership({ customer_id: "cus_B", customer: { has_account: true } }, "cus_A")).toThrow("another account")
  })
  it("requires a customer identity and always scopes non-draft orders to it", () => {
    expect(() => customerOrderQuery({ customer_id: "", offset: 0, limit: 10 })).toThrow("Sign in")
    expect(customerOrderQuery({ customer_id: "cus_A", offset: 10, limit: 10 }).variables).toEqual({
      filters: { customer_id: "cus_A", is_draft_order: false }, skip: 10, take: 10,
      order: { created_at: "DESC", id: "DESC" },
    })
  })

  it("scopes a receipt lookup to both the requested order and the signed-in customer", () => {
    expect(customerOrderQuery({ customer_id: "cus_A", order_id: "order_for_cus_B", offset: 0, limit: 1 }).variables.filters)
      .toEqual({ customer_id: "cus_A", id: "order_for_cus_B", is_draft_order: false })
    for (const query of [{ customer_id: "cus_B" }, { fields: "*payment_collections" }, { order_id: "order_other" }, { limit: 20 }]) {
      expect(CustomerOrderQuery.safeParse(query).success).toBe(false)
    }
    expect(CustomerOrderQuery.parse({})).toEqual({})
  })

  it("rejects attempts to supply another identity, arbitrary fields or unbounded pages", () => {
    for (const input of [{ customer_id: "cus_B" }, { email: "another@example.com" }, { fields: "*customer" }, { offset: -1 }, { limit: 1000 }, { limit: 0 }, { limit: 1.5 }]) {
      expect(CustomerOrdersQuery.safeParse(input).success).toBe(false)
    }
    expect(CustomerOrdersQuery.parse({ offset: "10", limit: "10" })).toEqual({ offset: 10, limit: 10 })
    expect(() => customerOrderQuery({ customer_id: "cus_A", offset: 0, limit: 1000 })).toThrow("pagination")
  })

  it("requests real tracking labels and strips internal data added by the core workflow", () => {
    const { fields } = customerOrderQuery({ customer_id: "cus_A", offset: 0, limit: 10 })
    expect(fields).toContain("fulfillments.labels.tracking_number")
    expect(fields).toContain("fulfillments.labels.tracking_url")
    const order = {
      id: "order_1", payment_status: "captured", fulfillment_status: "shipped",
      metadata: { private_note: "internal" }, customer_id: "cus_A",
      payment_collections: [{ data: { secret: "private" } }],
      items: [{ id: "item_1", title: "Sample", metadata: { internal: true } }],
      fulfillments: [{ id: "ful_1", data: { token: "private" }, labels: [{ tracking_number: "AB12345", tracking_url: "https://carrier.example/AB12345", label_url: "private-label" }] }],
    } as unknown as OrderDTO
    expect(publicCustomerOrder(order)).toEqual({
      id: "order_1", payment_status: "captured", fulfillment_status: "shipped",
      items: [{ id: "item_1", title: "Sample" }],
      fulfillments: [{ id: "ful_1", labels: [{ tracking_number: "AB12345", tracking_url: "https://carrier.example/AB12345" }] }],
    })
  })
})
