import type { Logger } from "@medusajs/framework/types"
import { Resend } from "resend"
import ResendNotificationProviderService from "../service"
import { buildEmail, EmailTemplates } from "../templates"

jest.mock("resend", () => ({ Resend: jest.fn() }))

describe("email-list emails", () => {
  const send = jest.fn()
  const logger = { error: jest.fn() } as unknown as Logger
  const provider = () => new ResendNotificationProviderService({ logger }, { api_key: "test", from: "VETUD <contact@example.com>" })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(Resend).mockImplementation(() => ({ emails: { send } }) as unknown as Resend)
    send.mockResolvedValue({ data: { id: "email_1" }, error: null })
  })

  it("sends the confirmation as a finished email in the visitor's language, without a Resend template", async () => {
    const confirm_url = "https://www.vetud.com/fr/newsletter/confirm?email=a%40example.com&expires=1&token=abc&x=<y>"
    await provider().send({ to: "a@example.com", channel: "email", template: EmailTemplates.EMAIL_LIST_CONFIRM, data: { locale: "fr", confirm_url } })
    const [message] = send.mock.calls[0]
    expect(message.template).toBeUndefined()
    expect(message.subject).toBe("Veuillez confirmer votre inscription aux e-mails VETUD")
    expect(message.html).toContain('<html lang="fr">')
    expect(message.html).toContain("Confirmer mon inscription")
    expect(message.html).toContain("&#38;x=&#60;y&#62;")
    expect(message.html).not.toContain("<y>")
    expect(message.text).toContain(confirm_url)
  })

  it("falls back to English for any other language", async () => {
    await provider().send({ to: "a@example.com", channel: "email", template: EmailTemplates.EMAIL_LIST_CONFIRM, data: { locale: "de", confirm_url: "https://www.vetud.com/en/newsletter/confirm" } })
    expect(send.mock.calls[0][0].subject).toBe("Please confirm your VETUD email sign-up")
  })

  it("alerts the owner about a confirmed subscriber, escaping the address", async () => {
    await provider().send({
      to: "contact@example.com",
      channel: "email",
      template: EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN,
      data: { email: "<b>a</b>@example.com", locale: "en", consented_at: "2026-11-18T10:00:00.000Z", confirmed_at: "2026-11-18T10:05:00.000Z", is_member: false, confirmed_count: 12 },
    })
    const [message] = send.mock.calls[0]
    expect(message.to).toEqual(["contact@example.com"])
    expect(message.subject).toBe("New email-list subscriber: <b>a</b>@example.com")
    expect(message.html).not.toContain("<b>a</b>")
    expect(message.html).toContain("English")
    expect(message.html).toContain("18 November 2026 at 10:05 UTC")
    expect(message.text).toContain("Confirmed subscribers:")
  })

  it("keeps the confirmation out of the template builders", () => {
    expect(buildEmail(EmailTemplates.EMAIL_LIST_CONFIRM, { locale: "en", confirm_url: "https://x" })).toMatchObject({ html: expect.any(String) })
  })
})
