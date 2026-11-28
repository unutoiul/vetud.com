import { isAnotherMembersEmail, exactIlike, memberIdsForEmail } from "../checkout-email"

describe("checkout email", () => {
  it("spots an email that another member account uses", () => {
    expect(isAnotherMembersEmail([], undefined)).toBe(false)
    expect(isAnotherMembersEmail(["cus_1"], undefined)).toBe(true)
    expect(isAnotherMembersEmail(["cus_1"], null)).toBe(true)
    expect(isAnotherMembersEmail(["cus_1"], "cus_2")).toBe(true)
    expect(isAnotherMembersEmail(["cus_1"], "cus_1")).toBe(false)
  })

  it("matches the whole address in any letter case, with no wildcards", () => {
    expect(exactIlike(" Ana_Lee%x\\y@Example.com ")).toBe("Ana\\_Lee\\%x\\\\y@Example.com")
  })

  it("looks only at member accounts, not Medusa's guest records", async () => {
    const graph = jest.fn().mockResolvedValue({ data: [{ id: "cus_1" }] })
    await expect(memberIdsForEmail({ graph }, "Ana@Example.com")).resolves.toEqual(["cus_1"])
    expect(graph).toHaveBeenCalledWith({
      entity: "customer",
      fields: ["id"],
      filters: { email: { $ilike: "Ana@Example.com" }, has_account: true },
    })
  })
})
