import { RUO_ACK_VERSION, validateResearchProfile } from "../research-profile"

const goodCart = () => ({
  customer_id: "cus_1",
  shipping_address: { company: "Acme Labs Ltd" },
  metadata: {
    research_field: "Peptide Chemistry",
    company_name: "Acme Labs Ltd",
    ruo_acknowledged: true,
    ruo_ack_version: RUO_ACK_VERSION,
  },
})

describe("validateResearchProfile", () => {
  it("accepts a signed-in customer with a complete research profile", () => {
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

  it("requires a company name in both the profile and the shipping address", () => {
    const noMeta = goodCart()
    noMeta.metadata.company_name = "  "
    expect(() => validateResearchProfile(noMeta, "cus_1")).toThrow(/company or institution/)
    expect(() => validateResearchProfile({ ...goodCart(), shipping_address: { company: "" } }, "cus_1")).toThrow(/company or institution/)
    expect(() => validateResearchProfile({ ...goodCart(), shipping_address: null }, "cus_1")).toThrow(/company or institution/)
  })

  it("requires a field of research from the list", () => {
    const missing = goodCart()
    delete (missing.metadata as Record<string, unknown>).research_field
    expect(() => validateResearchProfile(missing, "cus_1")).toThrow(/field of research/)
    const invented = goodCart()
    invented.metadata.research_field = "Bodybuilding"
    expect(() => validateResearchProfile(invented, "cus_1")).toThrow(/field of research/)
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
