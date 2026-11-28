import type { Logger } from "@medusajs/framework/types"
import { Resend } from "resend"
import ResendNotificationProviderService from "../service"
import { RESEND_TEMPLATE_IDS } from "../template-ids"
import { buildEmail, EmailTemplates } from "../templates"

jest.mock("resend", () => ({ Resend: jest.fn() }))

describe("email-list emails", () => {
  const send = jest.fn()
  const logger = { error: jest.fn() } as unknown as Logger
  const provider = () =>
    new ResendNotificationProviderService({ logger }, { api_key: "test", from: "VETUD <contact@example.com>" })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(Resend).mockImplementation(() => ({ emails: { send } }) as unknown as Resend)
    send.mockResolvedValue({ data: { id: "email_1" }, error: null })
  })

  it("sends the French confirmation template to a French visitor, with the link escaped", async () => {
    const confirm_url = "https://www.vetud.com/fr/newsletter/confirm?email=a%40example.com&expires=1&token=abc&x=<y>"
    await provider().send({
      to: "a@example.com",
      channel: "email",
      template: EmailTemplates.EMAIL_LIST_CONFIRM,
      data: { locale: "fr", confirm_url },
    })
    const [message] = send.mock.calls[0]
    expect(message.template.id).toBe(RESEND_TEMPLATE_IDS[EmailTemplates.EMAIL_LIST_CONFIRM_FR])
    expect(message.template.variables.CONFIRM_URL).toContain("&#38;x=&#60;y&#62;")
    expect(message.template.variables.CONFIRM_URL).not.toContain("<y>")
    expect(message.subject).toBeUndefined()
  })

  it("falls back to the English template for any other language", async () => {
    await provider().send({
      to: "a@example.com",
      channel: "email",
      template: EmailTemplates.EMAIL_LIST_CONFIRM,
      data: { locale: "de", confirm_url: "https://www.vetud.com/en/newsletter/confirm" },
    })
    expect(send.mock.calls[0][0].template.id).toBe(RESEND_TEMPLATE_IDS[EmailTemplates.EMAIL_LIST_CONFIRM])
  })

  it("alerts the owner about a confirmed subscriber, escaping the address in the email body", async () => {
    await provider().send({
      to: "contact@example.com",
      channel: "email",
      template: EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN,
      data: {
        email: "<b>a</b>@example.com",
        locale: "en",
        consented_at: "2026-11-18T10:00:00.000Z",
        confirmed_at: "2026-11-18T10:05:00.000Z",
        is_member: false,
        confirmed_count: 12,
      },
    })
    const [message] = send.mock.calls[0]
    expect(message.to).toEqual(["contact@example.com"])
    expect(message.subject).toBe("New email-list subscriber: <b>a</b>@example.com")
    expect(message.template).toEqual({
      id: RESEND_TEMPLATE_IDS[EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN],
      variables: {
        SUBSCRIBER_EMAIL: "&#60;b&#62;a&#60;/b&#62;@example.com",
        LANGUAGE: "English",
        MEMBER: "No",
        SIGNED_UP: "18 November 2026 at 10:00 UTC",
        CONFIRMED: "18 November 2026 at 10:05 UTC",
        COUNT: "12",
      },
    })
  })

  it("tells the owner about an unpaid book checkout", () => {
    const email = buildEmail(EmailTemplates.BOOK_OWNER_ALERT, {
      step: "checkout",
      email: "a@example.com",
      locale: "en",
      at: "2026-11-28T02:18:00.000Z",
      session_id: "cs_live_abc",
    })
    expect(email?.subject).toBe("Book: Checkout opened, not paid yet (a@example.com)")
    expect(email?.variables).toMatchObject({
      BUYER_EMAIL: "a@example.com",
      PAID: "Not yet",
      STEP: "2 of 3: checkout opened",
      STRIPE_SESSION: "cs_live_abc",
      WHEN: "28 November 2026 at 02:18 UTC",
    })
  })

  it("tells the owner about a paid book with the amount", () => {
    const email = buildEmail(EmailTemplates.BOOK_OWNER_ALERT, {
      step: "paid",
      email: "a@example.com",
      at: "2026-11-28T02:18:00.000Z",
      session_id: "cs_live_abc",
      amount: 499,
      currency: "usd",
    })
    expect(email?.variables).toMatchObject({ HEADLINE: "Book sold", PAID: "Yes, 4.99 USD", LANGUAGE: "Not known" })
  })

  it("fills the sign-in code template with the code only, never anything else typed", () => {
    expect(
      buildEmail(EmailTemplates.SIGN_IN_CODE, { code: "12a3456789", minutes: 10, first_name: "<Sam>" })?.variables,
    ).toEqual({ CODE: "123456", MINUTES: "10", GREETING: "Hi &#60;Sam&#62;," })
  })
})
