import { validateCartOwner } from "../cart-owner"

const member = (id: string) => ({ customer_id: id, customer: { has_account: true } })
const guest = (id: string) => ({ customer_id: id, customer: { has_account: false } })

describe("validateCartOwner", () => {
  it("accepts the member who owns the cart", () => {
    expect(() => validateCartOwner(member("cus_1"), "cus_1")).not.toThrow()
  })

  it("lets guests check out their own cart, signed in or not", () => {
    expect(() => validateCartOwner(guest("cus_guest"), undefined)).not.toThrow()
    expect(() => validateCartOwner(guest("cus_guest"), "cus_1")).not.toThrow()
    expect(() => validateCartOwner({ customer_id: null }, null)).not.toThrow()
    expect(() => validateCartOwner({ customer_id: null }, "cus_1")).not.toThrow()
  })

  it("asks a guest to sign in for a member's cart", () => {
    expect(() => validateCartOwner(member("cus_1"), undefined)).toThrow(/Sign in/)
  })

  it("rejects a member's cart for another member", () => {
    expect(() => validateCartOwner(member("cus_1"), "cus_2")).toThrow(/does not belong/)
  })

  it("treats a linked customer as a member when the account flag is missing", () => {
    expect(() => validateCartOwner({ customer_id: "cus_1" }, undefined)).toThrow(/Sign in/)
    expect(() => validateCartOwner({ customer_id: "cus_1", customer: null }, "cus_2")).toThrow(/does not belong/)
  })

  it("no longer asks for a research-use confirmation", () => {
    const legacy = { ...member("cus_1"), metadata: { ruo_acknowledged: false } }
    expect(() => validateCartOwner(legacy, "cus_1")).not.toThrow()
  })
})
