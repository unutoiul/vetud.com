import { createHmac, timingSafeEqual } from "node:crypto"
import type {
  AuthorizePaymentInput, AuthorizePaymentOutput, CapturePaymentInput,
  CancelPaymentInput, GetPaymentStatusInput, InitiatePaymentInput,
  RefundPaymentInput, UpdatePaymentInput,
} from "@medusajs/framework/types"
import { BigNumber, MedusaError } from "@medusajs/framework/utils"
import { NmiProviderService } from "medusa-payment-nmi"
import { assertNmiAchCaptureAllowed, nmiAmount } from "../../lib/nmi-settlement"
import type { NmiSettlementPayment } from "../../lib/nmi-settlement"
import { SingleAttemptNmiClient } from "./client"

type Data = Record<string, unknown>
type Options = ConstructorParameters<typeof NmiProviderService>[1] & {
  accountCurrency: string
  merchantCountry: string
  achEnabled: boolean
  walletsEnabled: boolean
}
type TrustedState = {
  phase: "session" | "payment"
  session_id: string
  amount: number
  currency_code: string
  billing?: Data
  transactionid?: string
  payment_method?: "card" | "ach"
  captured?: boolean
  canceled?: boolean
  refundId?: string
  ach_consent?: { version: string; recorded_at: string; account_type: string; account_holder_type: string; sec_code: "CCD" | "WEB" }
}

/** Keep the community provider's lifecycle; add store-specific trust/currency checks. */
export default class NmiProvider extends NmiProviderService {
  static identifier = "nmi"
  private readonly nmiOptions: Options
  private readonly moduleContainer: Record<string, unknown>

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options)
    this.nmiOptions = options
    this.moduleContainer = container
    this.client = new SingleAttemptNmiClient(options.securityKey, !!options.sandbox)
  }

  static validateOptions(options: Record<string, unknown>) {
    super.validateOptions(options)
    if (!/^[a-z]{3}$/.test(String(options.accountCurrency))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI requires an explicit accountCurrency.")
    }
    if (options.captureMethod !== "auth") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This store uses NMI auth-then-capture.")
    }
  }

  private signature(value: string) {
    return createHmac("sha256", this.nmiOptions.securityKey).update(`vetud-nmi-v1:${value}`).digest("hex")
  }

  private seal(state: TrustedState): Data {
    const nmi_state = JSON.stringify(state)
    return { ...state, nmi_state, nmi_signature: this.signature(nmi_state) }
  }

  private read(data?: Data, phase?: TrustedState["phase"]): TrustedState {
    const encoded = data?.nmi_state
    const signature = data?.nmi_signature
    if (typeof encoded !== "string" || typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature) ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(this.signature(encoded)))) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Payment details changed. Return to checkout and select your payment method again.")
    }
    const state = JSON.parse(encoded) as TrustedState
    if (phase && state.phase !== phase) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This NMI payment is not ready for that operation.")
    this.validateAmount(state.amount, state.currency_code)
    return state
  }

  private validateAmount(amount: unknown, currency: string) {
    if (currency.toLowerCase() !== this.nmiOptions.accountCurrency) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Card / bank checkout is only available in ${this.nmiOptions.accountCurrency.toUpperCase()}. Choose another payment method for this currency.`)
    }
    const value = new BigNumber(amount as number).numeric
    if (!Number.isFinite(value) || value <= 0 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI requires a positive amount with no more than two decimal places.")
    }
    return value
  }

  private publicSession(state: TrustedState, data: Data = {}): Data {
    return {
      ...this.seal(state),
      tokenizationKey: this.nmiOptions.tokenizationKey,
      sandbox: !!this.nmiOptions.sandbox,
      merchant_country: this.nmiOptions.merchantCountry,
      ach_enabled: this.nmiOptions.achEnabled,
      wallets_enabled: this.nmiOptions.walletsEnabled,
      payment_token: typeof data.payment_token === "string" ? data.payment_token : undefined,
      payment_method: data.payment_method,
      account_type: data.account_type,
      account_holder_type: data.account_holder_type,
      ach_authorized: data.ach_authorized === true,
    }
  }

  async initiatePayment(input: InitiatePaymentInput) {
    const amount = this.validateAmount(input.amount, input.currency_code)
    const sessionId = String(input.context?.idempotency_key ?? "")
    if (!sessionId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing payment session identity.")
    // Medusa supplies amount/currency and overwrites the id. Billing is populated
    // from the persisted cart by prepareNmiSessionWorkflow, never by the browser.
    return {
      id: `nmi_${sessionId}`,
      data: this.publicSession({ phase: "session", session_id: sessionId, amount, currency_code: input.currency_code.toLowerCase(), billing: input.data?.billing as Data | undefined }, input.data),
    }
  }

  async updatePayment(input: UpdatePaymentInput) {
    const previous = this.read(input.data, "session")
    const amount = this.validateAmount(input.amount, input.currency_code)
    // Cart edits invalidate a collected token. The shopper reviews the fresh total.
    return { data: this.publicSession({ ...previous, amount, currency_code: input.currency_code.toLowerCase() }) }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const state = this.read(input.data)
    if (state.session_id !== input.context?.idempotency_key) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Payment session does not match this checkout.")
    }
    if (state.phase === "payment") {
      if (state.canceled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This payment was canceled.")
      return { status: state.captured ? "captured" : "authorized", data: this.seal(state) }
    }
    const data = input.data ?? {}
    const method = data.payment_method
    if (!["card", "ach", "wallet"].includes(String(method)) || typeof data.payment_token !== "string" || !data.payment_token || data.payment_token.length > 1024) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter your payment details using the secure payment form.")
    }
    if ((method === "ach" && !this.nmiOptions.achEnabled) || (method === "wallet" && !this.nmiOptions.walletsEnabled)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This payment method is not enabled.")
    }
    if (method === "ach" && (data.ach_authorized !== true || !["checking", "savings"].includes(String(data.account_type)) || !["personal", "business"].includes(String(data.account_holder_type)))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Confirm the bank account type and authorize this single debit.")
    }
    const result = await super.authorizePayment({
      ...input,
      data: { ...state, payment_token: data.payment_token, payment_method: method, account_type: data.account_type, account_holder_type: data.account_holder_type },
    })
    if (result.status !== "authorized" || typeof result.data?.transactionid !== "string" || !result.data.transactionid) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "NMI did not confirm the authorization. Contact support before trying again.")
    }
    return { status: "authorized", data: this.seal({ phase: "payment", session_id: state.session_id, amount: state.amount, currency_code: state.currency_code, payment_method: method === "ach" ? "ach" : "card", transactionid: result.data.transactionid,
      ach_consent: method === "ach" ? { version: "vetud-single-debit-2026-10", recorded_at: new Date().toISOString(), account_type: String(data.account_type), account_holder_type: String(data.account_holder_type), sec_code: data.account_holder_type === "business" ? "CCD" : "WEB" } : undefined,
    }) }
  }

  async capturePayment(input: CapturePaymentInput) {
    const state = this.read(input.data, "payment")
    if (state.canceled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cannot capture a canceled payment.")
    if (state.payment_method === "ach") {
      // Lazy module-local resolution avoids circular construction. The Medusa
      // payment module's own service is available here, not the global graph.
      const payments = this.moduleContainer.paymentService as {
        list: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<NmiSettlementPayment[]>
      }
      const records = await payments.list({ payment_session_id: state.session_id }, { relations: ["payment_session"] })
      if (records.length !== 1) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cannot verify ACH settlement.")
      assertNmiAchCaptureAllowed(records[0], { ...state, transactionid: state.transactionid!, payment_method: "ach" })
    }
    if (state.captured) return { data: this.seal(state) }
    const captures = this.moduleContainer.captureService as { retrieve: (id: string) => Promise<{ amount: unknown }> }
    const captureId = input.context?.idempotency_key
    if (!captureId) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Capture must run through Medusa's payment workflow.")
    const capture = await captures.retrieve(captureId)
    if (nmiAmount(capture.amount) !== nmiAmount(state.amount)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Partial NMI capture is not supported. Capture the full authorization.")
    }
    await super.capturePayment({ ...input, data: state })
    return { data: this.seal({ ...state, captured: true }) }
  }

  async refundPayment(input: RefundPaymentInput) {
    const state = this.read(input.data, "payment")
    const amount = this.validateAmount(input.amount, state.currency_code)
    if (amount > state.amount) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Refund exceeds the original payment.")
    if (state.canceled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cannot refund a canceled payment.")
    // Never fall back to a void after an ambiguous refund response. If the
    // transaction is not settled, an operator must reconcile before canceling.
    const result = await this.client.transact({ type: "refund", transactionId: state.transactionid, amount })
    return { data: this.seal({ ...state, refundId: result.transactionid }) }
  }

  async cancelPayment(input: CancelPaymentInput) {
    const state = this.read(input.data, "payment")
    // An ACH void failure is NOT proof that the debit returned. Leave the
    // payment unchanged unless the gateway positively confirms the void.
    if (!state.canceled) await this.client.transact({ type: "void", transactionId: state.transactionid })
    return { data: this.seal({ ...state, canceled: true }) }
  }

  async getPaymentStatus(input: GetPaymentStatusInput) {
    const state = this.read(input.data)
    const status = state.canceled ? "canceled" : state.captured ? "captured" : state.phase === "payment" ? "authorized" : "pending"
    return { status, data: input.data } as Awaited<ReturnType<NmiProviderService["getPaymentStatus"]>>
  }

  // Reconciliation is performed by our verified workflow, including transaction
  // correlation. Core's generic webhook handler must not independently capture.
  async getWebhookActionAndData(): Promise<{ action: "not_supported" }> {
    return { action: "not_supported" }
  }
}
