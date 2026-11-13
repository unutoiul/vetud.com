import type { Logger, ProviderSendNotificationDTO } from "@medusajs/framework/types"
import { Resend } from "resend"
import { customerWelcomeNotifications } from "../../../workflows/send-customer-welcome"
import ResendNotificationProviderService from "../service"
import { RESEND_TEMPLATE_IDS } from "../template-ids"
import { buildEmail, EmailTemplates } from "../templates"

jest.mock("resend", () => ({ Resend: jest.fn() }))

describe("account welcome email", () => {
  const previousUrl = process.env.STOREFRONT_URL
  const send = jest.fn()
  const logger = { error: jest.fn() } as unknown as Logger
  const customer = { id: "cus_reader", email: "reader@example.com", first_name: "Sam", has_account: true }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STOREFRONT_URL = "https://education.example/"
    jest.mocked(Resend).mockImplementation(() => ({ emails: { send } }) as unknown as Resend)
  })
  afterAll(() => {
    if (previousUrl === undefined) delete process.env.STOREFRONT_URL
    else process.env.STOREFRONT_URL = previousUrl
  })

  it("welcomes a registered account with its name, site URL and a stable retry key", () => {
    const [notification] = customerWelcomeNotifications(customer)
    expect(notification).toMatchObject({
      to: customer.email, template: EmailTemplates.CUSTOMER_WELCOME,
      data: { first_name: "Sam", storefront_url: "https://education.example" },
      idempotency_key: "customer-welcome:cus_reader",
    })
    expect(customerWelcomeNotifications(customer)[0].idempotency_key).toBe(notification.idempotency_key)
    expect(customerWelcomeNotifications({ ...customer, id: "cus_other" })[0].idempotency_key).not.toBe(notification.idempotency_key)
  })

  it("does not send to guests, missing customers or customers without an email", () => {
    expect(customerWelcomeNotifications(undefined)).toEqual([])
    expect(customerWelcomeNotifications({ ...customer, has_account: false })).toEqual([])
    expect(customerWelcomeNotifications({ ...customer, email: null })).toEqual([])
  })

  it("escapes names before inserting them into the published template and handles unnamed accounts", () => {
    const email = buildEmail(EmailTemplates.CUSTOMER_WELCOME, { first_name: '<img src=x onerror="alert(1)"> & Sam', storefront_url: "https://education.example" })
    expect(email?.variables).toMatchObject({ NAME_SUFFIX: ", &#60;img src=x onerror=&#34;alert(1)&#34;&#62; &#38; Sam" })
    expect(buildEmail(EmailTemplates.CUSTOMER_WELCOME, { first_name: null, storefront_url: "https://education.example" })?.variables).toMatchObject({ NAME_SUFFIX: "" })
  })

  it("sends the exact published welcome template with the required variable names", async () => {
    send.mockResolvedValue({ data: { id: "email_welcome" }, error: null })
    const provider = new ResendNotificationProviderService({ logger }, { api_key: "test", from: "VETUD <contact@example.com>" })
    const [notification] = customerWelcomeNotifications(customer)
    await expect(provider.send(notification as ProviderSendNotificationDTO)).resolves.toEqual({ id: "email_welcome" })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: [customer.email],
      template: { id: RESEND_TEMPLATE_IDS[EmailTemplates.CUSTOMER_WELCOME], variables: { NAME_SUFFIX: ", Sam", STOREFRONT_URL: "https://education.example" } },
    }), { idempotencyKey: "customer-welcome:cus_reader" })
  })

  it("propagates a rejected send so Medusa can record the failure and retry", async () => {
    send.mockResolvedValue({ data: null, error: { message: "Temporarily unavailable" } })
    const provider = new ResendNotificationProviderService({ logger }, { api_key: "test", from: "contact@example.com" })
    const [notification] = customerWelcomeNotifications(customer)
    await expect(provider.send(notification as ProviderSendNotificationDTO)).rejects.toThrow("Temporarily unavailable")
  })

  it("leaves other email sends without a welcome idempotency key", async () => {
    send.mockResolvedValue({ data: { id: "email_reset" }, error: null })
    const provider = new ResendNotificationProviderService({ logger }, { api_key: "test", from: "contact@example.com" })
    await provider.send({ to: customer.email, channel: "email", template: EmailTemplates.PASSWORD_RESET, data: { reset_url: "https://education.example/en/account/reset-password?token=test" } })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ template: expect.objectContaining({ id: RESEND_TEMPLATE_IDS[EmailTemplates.PASSWORD_RESET] }) }), undefined)
  })
})
