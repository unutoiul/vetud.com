import { guestCheckoutAlertKey, isGuestCheckout, isNewNewsletterSignup } from "../owner-alerts"
import { guestCheckoutAlert, newsletterSignupAlert } from "../../modules/resend/owner-alerts"
import { buildEmail, EmailTemplates } from "../../modules/resend/templates"
import { RESEND_TEMPLATE_IDS } from "../../modules/resend/template-ids"

describe("isGuestCheckout", () => {
  const cart = { id: "cart_1", email: "ana@example.com", completed_at: null, items: [{}] }

  it("counts a cart with items and an email whose customer is missing or has no account", () => {
    expect(isGuestCheckout(cart)).toBe(true)
    expect(isGuestCheckout({ ...cart, customer: null })).toBe(true)
    expect(isGuestCheckout({ ...cart, customer: { has_account: false } })).toBe(true)
  })

  it("never counts a signed-in member, or a customer whose account flag wasn't loaded", () => {
    expect(isGuestCheckout({ ...cart, customer: { has_account: true } })).toBe(false)
    expect(isGuestCheckout({ ...cart, customer: {} })).toBe(false)
  })

  it("waits for the email and items, and stops once the order is placed", () => {
    expect(isGuestCheckout({ ...cart, email: null })).toBe(false)
    expect(isGuestCheckout({ ...cart, items: [] })).toBe(false)
    expect(isGuestCheckout({ ...cart, completed_at: new Date() })).toBe(false)
    expect(isGuestCheckout(undefined)).toBe(false)
  })

  it("keys one alert per cart and address, whatever the casing", () => {
    expect(guestCheckoutAlertKey("cart_1", " Ana@Example.com ")).toBe(
      guestCheckoutAlertKey("cart_1", "ana@example.com"),
    )
    expect(guestCheckoutAlertKey("cart_1", "ana@example.com")).not.toBe(
      guestCheckoutAlertKey("cart_1", "bob@example.com"),
    )
  })
})

describe("isNewNewsletterSignup", () => {
  it("is new for an unknown address, or one that unsubscribed", () => {
    expect(isNewNewsletterSignup(null, false)).toBe(true)
    expect(isNewNewsletterSignup({ marketing_consent: false }, false)).toBe(true)
    expect(isNewNewsletterSignup({ marketing_consent: true }, false)).toBe(true)
  })

  it("isn't new when the address is already subscribed", () => {
    expect(isNewNewsletterSignup({ marketing_consent: true }, true)).toBe(false)
  })
})

describe("owner alert emails", () => {
  it("escapes what the shopper typed and lists the cart", () => {
    const email = buildEmail(EmailTemplates.GUEST_CHECKOUT_ADMIN, {
      email: "<b>ana</b>@example.com",
      currency_code: "usd",
      items: [{ title: "Retatrutide · 10 mg", quantity: 2, unit_price: 89.5 }],
      region: "North America",
      account_exists: false,
      started_at: "2026-11-18T10:00:00.000Z",
      unfinished_url: "https://admin.example/app/unfinished-checkouts",
    })!
    expect(email.subject).toBe("Guest checkout started: <b>ana</b>@example.com ($179.00)")
    expect(email.template).toBe(EmailTemplates.GUEST_CHECKOUT_ADMIN)
    expect(email.variables).toMatchObject({
      CUSTOMER_EMAIL: "&#60;b&#62;ana&#60;/b&#62;@example.com",
      CART: "Retatrutide · 10 mg × 2 · $179.00",
      CART_VALUE: "$179.00",
      STARTED: "18 November 2026 at 10:00 UTC",
      UNFINISHED_URL: "https://admin.example/app/unfinished-checkouts",
    })
  })

  it("names the country and the offer code sent", () => {
    const alert = newsletterSignupAlert({
      email: "ana@example.com",
      country_code: "de",
      has_account: false,
      offer_code: "WINTER10",
      subscribed_at: "2026-11-18T10:00:00.000Z",
      customer_url: "https://admin.example/app/customers/cus_1",
    })
    expect(alert.subject).toBe("New newsletter sign-up: ana@example.com")
    expect(alert.variables).toMatchObject({
      COUNTRY: "Germany (DE)",
      OFFER_CODE: "WINTER10",
      CUSTOMER_URL: "https://admin.example/app/customers/cus_1",
    })
  })

  it("says when no offer was running", () => {
    expect(
      buildEmail(EmailTemplates.NEWSLETTER_SIGNUP_ADMIN, {
        email: "ana@example.com",
        has_account: true,
        subscribed_at: "2026-11-18T10:00:00.000Z",
        customer_url: "https://admin.example/app/customers/cus_1",
      })?.variables.OFFER_CODE,
    ).toBe("None (no pop-up offer is running)")
  })

  it("has a published Resend template for every shop email", () => {
    for (const template of Object.values(EmailTemplates))
      expect(RESEND_TEMPLATE_IDS[template]).toMatch(/^[0-9a-f-]{36}$/)
  })
})
