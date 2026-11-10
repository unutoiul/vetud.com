import { confirmToken, isValidConfirmToken, isValidUnsubscribeToken, normalizeEmail, unsubscribeToken } from "../email-list"

describe("email list links", () => {
  const previous = process.env.JWT_SECRET
  const now = 1_800_000_000_000
  const expires = now + 60_000

  beforeAll(() => { process.env.JWT_SECRET = "test-secret" })
  afterAll(() => { process.env.JWT_SECRET = previous })

  it("accepts a confirmation link until it expires, whatever the email's case", () => {
    const token = confirmToken("Reader@Example.com ", expires)
    expect(isValidConfirmToken("reader@example.com", expires, token, now)).toBe(true)
    expect(isValidConfirmToken("reader@example.com", expires, token, expires + 1)).toBe(false)
  })

  it("rejects links made for another address or with a changed expiry", () => {
    const token = confirmToken("reader@example.com", expires)
    expect(isValidConfirmToken("other@example.com", expires, token, now)).toBe(false)
    expect(isValidConfirmToken("reader@example.com", expires + 1000, token, now)).toBe(false)
    expect(isValidConfirmToken("reader@example.com", expires, "short", now)).toBe(false)
  })

  it("keeps confirm and unsubscribe tokens apart", () => {
    const unsubscribe = unsubscribeToken("reader@example.com")
    expect(isValidUnsubscribeToken("reader@example.com", unsubscribe)).toBe(true)
    expect(isValidUnsubscribeToken("reader@example.com", confirmToken("reader@example.com", expires))).toBe(false)
    expect(isValidConfirmToken("reader@example.com", expires, unsubscribe, now)).toBe(false)
  })

  it("normalizes addresses", () => {
    expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co")
  })
})
