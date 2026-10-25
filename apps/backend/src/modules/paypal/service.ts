import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { AbstractPaymentProvider, BigNumber, MedusaError } from "@medusajs/framework/utils"
import { formatAmount, PayPalClient, type PayPalOptions, type PayPalOrder } from "./client"

type SessionData = Record<string, unknown>

/**
 * PayPal checkout through the redirect flow:
 *  1. initiatePayment creates a PayPal order and exposes its approval URL in the session data.
 *  2. The shopper approves on PayPal and returns to the storefront.
 *  3. The storefront completes the cart, which calls authorizePayment; the approved order is
 *     captured there, so the payment is "captured" as soon as the order exists.
 */
class PayPalProviderService extends AbstractPaymentProvider<PayPalOptions> {
  static identifier = "paypal"

  protected readonly client: PayPalClient

  constructor(cradle: Record<string, unknown>, options: PayPalOptions) {
    super(cradle, options)
    this.client = new PayPalClient(options)
  }

  static validateOptions(options: Record<string, unknown>): void {
    for (const key of ["client_id", "client_secret", "storefront_url"]) {
      if (!options[key]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Option \`${key}\` is required in the PayPal provider's options.`)
      }
    }
    if (options.environment && options.environment !== "sandbox" && options.environment !== "live") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Option `environment` must be \"sandbox\" or \"live\".")
    }
  }

  private orderId(data?: SessionData): string {
    const id = data?.paypal_order_id
    if (typeof id !== "string" || !id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The payment session has no PayPal order.")
    }
    return id
  }

  private async createSession(amount: InitiatePaymentInput["amount"], currencyCode: string, idempotencyKey?: string) {
    const value = formatAmount(new BigNumber(amount).numeric, currencyCode)
    const order = await this.client.createOrder(value, currencyCode, idempotencyKey)
    const approveUrl = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href
    if (!approveUrl) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "PayPal did not return an approval URL.")
    }
    const data: SessionData = {
      paypal_order_id: order.id,
      paypal_status: order.status,
      approve_url: approveUrl,
      amount_value: value,
      currency_code: currencyCode.toUpperCase(),
    }
    return { id: order.id, data }
  }

  /** Maps a PayPal order to a Medusa payment status plus the data to persist. */
  private describe(order: PayPalOrder, previous: SessionData = {}): { status: PaymentSessionStatus; data: SessionData } {
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
    const data: SessionData = {
      ...previous,
      paypal_order_id: order.id,
      paypal_status: order.status,
      ...(capture ? { capture_id: capture.id, capture_status: capture.status } : {}),
      ...(order.payer?.email_address ? { payer_email: order.payer.email_address } : {}),
    }

    let status: PaymentSessionStatus
    switch (order.status) {
      case "COMPLETED":
        if (capture?.status === "COMPLETED") status = "captured"
        // A capture PayPal is still reviewing: the order can be placed, funds are not final yet.
        else if (capture?.status === "PENDING") status = "authorized"
        else status = "error"
        break
      case "VOIDED":
        status = "canceled"
        break
      case "APPROVED":
        status = "pending"
        break
      default:
        // CREATED / PAYER_ACTION_REQUIRED: the shopper has not approved the payment yet.
        status = "requires_more"
    }
    return { status, data }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { id, data } = await this.createSession(input.amount, input.currency_code, input.context?.idempotency_key)
    return { id, data, status: "pending" }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = (input.data ?? {}) as SessionData
    const value = formatAmount(new BigNumber(input.amount).numeric, input.currency_code)
    const unchanged = current.amount_value === value && current.currency_code === input.currency_code.toUpperCase()
    if (unchanged && current.paypal_order_id) return { data: current, status: "pending" }

    // A PayPal order's amount is fixed once the shopper may have seen it, so issue a fresh one.
    const { data } = await this.createSession(input.amount, input.currency_code)
    return { data, status: "pending" }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const current = (input.data ?? {}) as SessionData
    const orderId = this.orderId(current)
    let order = await this.client.getOrder(orderId)
    if (order.status === "APPROVED") {
      order = await this.client.captureOrder(orderId)
    }
    const { status, data } = this.describe(order, current)
    return { status, data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const current = (input.data ?? {}) as SessionData
    const orderId = this.orderId(current)
    let order = await this.client.getOrder(orderId)
    if (order.status === "APPROVED") {
      order = await this.client.captureOrder(orderId)
    } else if (order.status !== "COMPLETED") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The shopper has not approved this PayPal payment yet.")
    }
    return { data: this.describe(order, current).data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const current = (input.data ?? {}) as SessionData
    const captureId = current.capture_id
    if (typeof captureId !== "string" || !captureId) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This payment has not been captured on PayPal, so it cannot be refunded.")
    }
    const currency = String(current.currency_code ?? "")
    const refund = await this.client.refundCapture(captureId, formatAmount(new BigNumber(input.amount).numeric, currency), currency)
    const refundIds = Array.isArray(current.refund_ids) ? (current.refund_ids as string[]) : []
    return { data: { ...current, refund_ids: [...refundIds, refund.id] } }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const current = (input.data ?? {}) as SessionData
    const order = await this.client.getOrder(this.orderId(current))
    const { status, data } = this.describe(order, current)
    return { status, data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const current = (input.data ?? {}) as SessionData
    const order = await this.client.getOrder(this.orderId(current))
    return { data: this.describe(order, current).data }
  }

  // PayPal orders that are never approved expire on their own, and a captured payment is
  // reversed with a refund, so there is nothing to cancel or delete on PayPal's side.
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  // Capture happens synchronously in authorizePayment, so no webhook is needed.
  async getWebhookActionAndData(_payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}

export default PayPalProviderService
