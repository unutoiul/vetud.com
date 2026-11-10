import { validateCartOwner } from "../cart-owner"

describe("validateCartOwner", () => {
  it("accepts the cart owner", () => {
    expect(() => validateCartOwner({ customer_id: "cus_1" }, "cus_1")).not.toThrow()
  })

  it("rejects guests", () => {
    expect(() => validateCartOwner({ customer_id: "cus_1" }, undefined)).toThrow(/Sign in/)
    expect(() => validateCartOwner({ customer_id: null }, null)).toThrow(/Sign in/)
  })

  it("rejects a cart that belongs to another account, or to no account", () => {
    expect(() => validateCartOwner({ customer_id: "cus_1" }, "cus_2")).toThrow(/does not belong/)
    expect(() => validateCartOwner({ customer_id: null }, "cus_1")).toThrow(/does not belong/)
  })

  it("no longer asks for a research-use confirmation", () => {
    expect(() => validateCartOwner({ customer_id: "cus_1" }, "cus_1")).not.toThrow()
    const legacy = { customer_id: "cus_1", metadata: { ruo_acknowledged: false } }
    expect(() => validateCartOwner(legacy, "cus_1")).not.toThrow()
  })
})
