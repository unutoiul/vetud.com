import { MedusaError } from "@medusajs/framework/utils"
import { randomUUID } from "node:crypto"

export type PayPalOptions = {
  client_id: string
  client_secret: string
  /** "sandbox" for testing with sandbox credentials, "live" for real payments. */
  environment?: "sandbox" | "live"
  /** Public storefront origin, used for the PayPal return and cancel URLs. */
  storefront_url: string
  brand_name?: string
}

export type PayPalCapture = { id: string; status: string; amount?: { value: string; currency_code: string } }

export type PayPalOrder = {
  id: string
  status: string
  links?: { rel: string; href: string }[]
  payer?: { email_address?: string }
  purchase_units?: { payments?: { captures?: PayPalCapture[] } }[]
}

/** Currencies PayPal accepts, with the number of decimals each takes (HUF, JPY and TWD take none). */
export const PAYPAL_CURRENCIES: Record<string, number> = {
  AUD: 2, BRL: 2, CAD: 2, CHF: 2, CNY: 2, CZK: 2, DKK: 2, EUR: 2, GBP: 2, HKD: 2, HUF: 0, ILS: 2,
  JPY: 0, MXN: 2, MYR: 2, NOK: 2, NZD: 2, PHP: 2, PLN: 2, SEK: 2, SGD: 2, THB: 2, TWD: 0, USD: 2,
}

/** Formats a major-unit amount the way PayPal expects, e.g. 12.5 USD -> "12.50", 1500 JPY -> "1500". */
export function formatAmount(value: number, currencyCode: string): string {
  const decimals = PAYPAL_CURRENCIES[currencyCode.toUpperCase()]
  if (decimals === undefined) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `PayPal does not support ${currencyCode.toUpperCase()}. Choose another payment method for this region.`
    )
  }
  return value.toFixed(decimals)
}

const BASE_URLS = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
}

export class PayPalClient {
  private token: { value: string; expiresAt: number } | null = null
  private readonly baseUrl: string

  constructor(private readonly options: PayPalOptions) {
    this.baseUrl = BASE_URLS[options.environment === "live" ? "live" : "sandbox"]
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value

    const credentials = Buffer.from(`${this.options.client_id}:${this.options.client_secret}`).toString("base64")
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    })
    const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number }
    if (!response.ok || !body.access_token) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "PayPal rejected the configured client credentials.")
    }
    this.token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 }
    return this.token.value
  }

  private async request<T>(method: string, path: string, body?: unknown, requestId?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        "Content-Type": "application/json",
        ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    const json = text ? JSON.parse(text) : {}
    if (!response.ok) {
      const issue = json?.details?.[0]?.issue as string | undefined
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `PayPal ${method} ${path} failed (${response.status}${issue ? ` ${issue}` : ""}): ${json?.message ?? "unknown error"} [debug_id ${json?.debug_id ?? "-"}]`,
        issue
      )
    }
    return json as T
  }

  createOrder(amount: string, currencyCode: string, idempotencyKey?: string): Promise<PayPalOrder> {
    const storefront = this.options.storefront_url.replace(/\/$/, "")
    return this.request<PayPalOrder>(
      "POST",
      "/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [{ reference_id: "default", amount: { currency_code: currencyCode.toUpperCase(), value: amount } }],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: `${storefront}/order/paypal-return`,
              cancel_url: `${storefront}/order/paypal-return?cancelled=1`,
              user_action: "PAY_NOW",
              // The storefront already collected the shipping address.
              shipping_preference: "NO_SHIPPING",
              brand_name: this.options.brand_name ?? "Vetud",
            },
          },
        },
      },
      idempotencyKey ?? randomUUID()
    )
  }

  getOrder(orderId: string): Promise<PayPalOrder> {
    return this.request<PayPalOrder>("GET", `/v2/checkout/orders/${encodeURIComponent(orderId)}`)
  }

  async captureOrder(orderId: string): Promise<PayPalOrder> {
    try {
      return await this.request<PayPalOrder>("POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, `capture-${orderId}`)
    } catch (error) {
      // A retried capture (page reload, double click) must not fail: read the order as it now stands.
      if (error instanceof MedusaError && error.code === "ORDER_ALREADY_CAPTURED") return this.getOrder(orderId)
      throw error
    }
  }

  refundCapture(captureId: string, amount: string, currencyCode: string): Promise<{ id: string; status: string }> {
    return this.request(
      "POST",
      `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
      { amount: { value: amount, currency_code: currencyCode.toUpperCase() } },
      randomUUID()
    )
  }
}
