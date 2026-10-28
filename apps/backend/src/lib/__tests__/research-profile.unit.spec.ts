import { RUO_ACK_VERSION, validateResearchProfile } from "../research-profile"

const goodCart = () => ({
  customer_id: "cus_1",
  metadata: {
    ruo_acknowledged: true,
    ruo_ack_version: RUO_ACK_VERSION,
  },
})

describe("validateResearchProfile", () => {
  it("accepts the cart owner with current consent and no company or field of research", () => {
    expect(() => validateResearchProfile(goodCart(), "cus_1")).not.toThrow()
  })

  it("rejects guests", () => {
    expect(() => validateResearchProfile(goodCart(), undefined)).toThrow(/Sign in/)
    expect(() => validateResearchProfile({ ...goodCart(), customer_id: null }, null)).toThrow(/Sign in/)
  })

  it("rejects a cart that belongs to another account, or to no account", () => {
    expect(() => validateResearchProfile(goodCart(), "cus_2")).toThrow(/does not belong/)
    expect(() => validateResearchProfile({ ...goodCart(), customer_id: null }, "cus_1")).toThrow(/does not belong/)
  })

  it("accepts an existing cart carrying legacy research details", () => {
    const cart = goodCart()
    Object.assign(cart.metadata, { company_name: "Acme Labs Ltd", research_field: "Peptide Chemistry" })
    expect(() => validateResearchProfile(cart, "cus_1")).not.toThrow()
  })

  it("rejects missing consent metadata", () => {
    expect(() => validateResearchProfile({ customer_id: "cus_1" }, "cus_1")).toThrow(/laboratory research purposes only/)
    expect(() => validateResearchProfile({ customer_id: "cus_1", metadata: null }, "cus_1")).toThrow(/laboratory research purposes only/)
  })

  it("requires the current research-use acknowledgment", () => {
    const unticked = goodCart()
    ;(unticked.metadata as Record<string, unknown>).ruo_acknowledged = false
    expect(() => validateResearchProfile(unticked, "cus_1")).toThrow(/laboratory research purposes only/)
    const stale = goodCart()
    stale.metadata.ruo_ack_version = "2020-01"
    expect(() => validateResearchProfile(stale, "cus_1")).toThrow(/laboratory research purposes only/)
    const stringTrue = goodCart()
    ;(stringTrue.metadata as Record<string, unknown>).ruo_acknowledged = "true"
    expect(() => validateResearchProfile(stringTrue, "cus_1")).toThrow(/laboratory research purposes only/)
  })
})
