import type {
  InitiatePaymentInput, InitiatePaymentOutput, UpdatePaymentInput, UpdatePaymentOutput,
  AuthorizePaymentInput, AuthorizePaymentOutput, CapturePaymentInput, CapturePaymentOutput,
  CancelPaymentInput, CancelPaymentOutput, DeletePaymentInput, DeletePaymentOutput,
  RefundPaymentInput, RefundPaymentOutput, RetrievePaymentInput, RetrievePaymentOutput,
  GetPaymentStatusInput, GetPaymentStatusOutput, ProviderWebhookPayload, WebhookActionResult,
} from "@medusajs/framework/types"
import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import { randomUUID } from "node:crypto"
import { CallbackToken, PayGate } from "paygate-to"
import { type PaygateConfig, paygateError } from "../../lib/paygate-config"
import { decimal, readPaygate, sealPaygate, type PaygateState } from "../../lib/paygate-state"

type Options = PaygateConfig & { mode: "card" | "crypto" }

export default class PaygateProvider extends AbstractPaymentProvider<Options> {
  static identifier = "paygate"
  private readonly client: PayGate
  private readonly settings: Options

  constructor(cradle: Record<string, unknown>, options: Options) {
    super(cradle, options)
    this.settings = options
    this.client = new PayGate({ apiDomain: options.apiDomain, checkoutDomain: options.checkoutDomain, timeoutMs: 15000, retries: 1 })
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = input.context?.idempotency_key
    const cartId = input.data?.cart_id
    const email = input.data?.email
    if (!sessionId || typeof cartId !== "string" || typeof email !== "string") paygateError("Start PayGate from an authenticated checkout.")
    const amount = new BigNumber(input.amount).bigNumber!.toFixed()
    if (!decimal(amount).gt(0)) paygateError("PayGate requires a positive order total.")
    const currency = input.currency_code.toUpperCase()
    const expected = await this.client.card.convertToUsd(amount, currency)
    if (!decimal(expected.value).gt(0)) paygateError("PayGate could not quote this currency.")
    const reference = `${sessionId}.${randomUUID()}`
    const callback = new CallbackToken(this.settings.secret).callbackUrl(this.settings.callbackUrl, { reference, session: sessionId })
    let checkoutUrl: string
    let depositAddress = ""
    if (this.settings.mode === "card") {
      const providers = await this.client.card.providers()
      const eligible = await Promise.all(providers.filter(provider => provider.active).map(async provider => {
        if (!provider.minimumAmount || !provider.minimumCurrency) return false
        const minimum = await this.client.card.convertToUsd(provider.minimumAmount, provider.minimumCurrency)
        return decimal(expected.value).gte(decimal(minimum.value))
      }))
      if (!eligible.some(Boolean)) paygateError("This order is below the available card providers' minimum or card checkout is temporarily unavailable.")
      const wallet = await this.client.card.createWallet(this.settings.cardWallet, callback)
      depositAddress = wallet.polygonAddressIn
      if (!/^0x[\da-f]{40}$/i.test(depositAddress)) paygateError("PayGate returned an invalid deposit address.")
      checkoutUrl = this.client.card.paymentUrl(wallet, amount, email, currency)
    } else {
      const wallet = await this.client.crypto.createHostedWallet(this.settings.wallets, amount, currency, callback)
      checkoutUrl = this.client.crypto.hostedPaymentUrl(wallet, { addFees: true })
    }
    const state: PaygateState = {
      session_id: sessionId, reference, cart_id: cartId, mode: this.settings.mode,
      amount, currency, expected_usd: decimal(expected.value).toFixed(),
      payout_wallets: this.settings.mode === "card" ? [this.settings.cardWallet] : Object.values(this.settings.wallets).filter((value): value is string => !!value),
      deposit_address: depositAddress, checkout_url: checkoutUrl, receipts: [], settled: false, canceled: false, review: "",
    }
    return { id: reference, status: "pending", data: { paygate: sealPaygate(state, this.settings.secret) } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const state = readPaygate(input.data, this.settings.secret)
    if (!decimal(state.amount).eq(new BigNumber(input.amount).bigNumber!) || state.currency !== input.currency_code.toUpperCase()) {
      paygateError("Your order total changed. Choose PayGate again to create a new payment link.")
    }
    return { data: input.data, status: state.settled ? "captured" : "pending_authorization" }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const state = readPaygate(input.data, this.settings.secret)
    if (state.canceled) paygateError("This PayGate checkout was canceled.")
    return { data: input.data, status: state.settled ? "captured" : "pending_authorization" }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const state = readPaygate(input.data, this.settings.secret)
    if (!state.settled || state.canceled || state.review) paygateError("A verified full PayGate settlement is required before capture.")
    if (!decimal(state.amount).eq(new BigNumber(input.amount).bigNumber!)) paygateError("Partial PayGate captures are not supported.")
    return { data: input.data }
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    paygateError("PayGate payouts cannot be reversed through this API. Arrange and verify the refund separately; no funds were sent by Medusa.")
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const state = readPaygate(input.data, this.settings.secret)
    if (state.settled) paygateError("This PayGate payment has settled; arrange a refund instead of cancellation.")
    return { data: { paygate: sealPaygate({ ...state, canceled: true }, this.settings.secret) } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    readPaygate(input.data, this.settings.secret)
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const state = readPaygate(input.data, this.settings.secret)
    return { data: input.data, status: state.canceled ? "canceled" : state.settled ? "captured" : "pending_authorization" }
  }

  // PayGate sends signed GET callbacks to /paygate/callback, not Medusa's POST webhook endpoint.
  async getWebhookActionAndData(_payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}
