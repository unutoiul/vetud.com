import { checkoutFunnel, furthestCheckoutStep } from "../checkout-progress"

describe("checkout progress", () => {
  it("reads the furthest step from the cart", () => {
    expect(furthestCheckoutStep({})).toBe("cart")
    expect(furthestCheckoutStep({ email: "a@b.test" })).toBe("contact")
    expect(furthestCheckoutStep({ email: "a@b.test", shipping_address: { address_1: "1 Road" } })).toBe("address")
    expect(
      furthestCheckoutStep({ email: "a@b.test", shipping_address: { address_1: "1 Road" }, shipping_methods: [{}] }),
    ).toBe("delivery")
    expect(
      furthestCheckoutStep({
        email: "a@b.test",
        shipping_methods: [{}],
        payment_collection: { payment_sessions: [{}] },
      }),
    ).toBe("payment")
    expect(furthestCheckoutStep({ completed_at: "2026-11-17T10:00:00Z" })).toBe("placed")
  })

  it("ignores an empty address and empty lists", () => {
    expect(
      furthestCheckoutStep({
        email: "a@b.test",
        shipping_address: { address_1: "" },
        shipping_methods: [],
        payment_collection: { payment_sessions: [] },
      }),
    ).toBe("contact")
  })

  it("counts carts that reached at least each step", () => {
    const funnel = checkoutFunnel([
      {},
      { email: "a@b.test" },
      { email: "a@b.test", shipping_address: { address_1: "1 Road" } },
      { completed_at: new Date() },
    ])
    expect(funnel).toEqual({ cart: 4, contact: 3, address: 2, delivery: 1, payment: 1, placed: 1 })
  })
})
