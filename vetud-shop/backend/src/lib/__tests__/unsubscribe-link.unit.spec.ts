import { isValidUnsubscribeToken } from "../newsletter"
import { buildEmail, EmailTemplates } from "../../modules/resend/templates"

describe("unsubscribe link in customer emails", () => {
  const previous = process.env.JWT_SECRET
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret"
  })
  afterAll(() => {
    if (previous === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previous
  })

  it("adds a signed link for the recipient to customer emails", () => {
    const email = buildEmail(EmailTemplates.PASSWORD_RESET, { reset_url: "https://x" }, "A@Example.com")
    const url = new URL((email?.variables.UNSUBSCRIBE_URL ?? "").replace(/&#38;/g, "&"))
    expect(url.pathname).toBe("/newsletter/unsubscribe")
    expect(url.searchParams.get("email")).toBe("a@example.com")
    expect(isValidUnsubscribeToken("a@example.com", url.searchParams.get("token") ?? "")).toBe(true)
  })

  it("keeps the newsletter's own link, which carries the visitor's country", () => {
    const email = buildEmail(
      EmailTemplates.NEWSLETTER_OFFER,
      { offer: null, shop_url: "https://shop/de/shop", unsubscribe_url: "https://shop/de/newsletter/unsubscribe?x=1" },
      "a@example.com",
    )
    expect(email?.template).toBe(EmailTemplates.NEWSLETTER_WELCOME)
    expect(email?.variables.UNSUBSCRIBE_URL).toBe("https://shop/de/newsletter/unsubscribe?x=1")
  })

  it("leaves the link out of the owner's emails", () => {
    const email = buildEmail(
      EmailTemplates.CONTACT_MESSAGE,
      { name: "A", email: "a@example.com", message: "Hi" },
      "owner@example.com",
    )
    expect(email?.variables.UNSUBSCRIBE_URL).toBeUndefined()
  })

  it("keeps only the digits of a sign-in code", () => {
    expect(buildEmail(EmailTemplates.SIGN_IN_CODE, { code: "12D3a456", minutes: 10 })?.variables.CODE).toBe("123456")
  })
})
