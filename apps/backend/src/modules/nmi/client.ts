import { MedusaError } from "@medusajs/framework/utils"
import { NmiClient, buildChargeParams, parseTransactResponse } from "medusa-payment-nmi/lib/nmi-client"

/** Reuse the plugin's protocol, but never retry a money-moving POST automatically. */
export class SingleAttemptNmiClient extends NmiClient {
  private readonly gatewayKey: string
  private readonly gatewayUrl: string

  constructor(securityKey: string, sandbox: boolean) {
    super(securityKey, sandbox)
    this.gatewayKey = securityKey
    this.gatewayUrl = `https://${sandbox ? "sandbox" : "secure"}.nmi.com/api/transact.php`
  }

  async transact(input: Parameters<NmiClient["transact"]>[0]) {
    let response: Response
    let body: string
    try {
      response = await fetch(this.gatewayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: buildChargeParams({ ...input, securityKey: this.gatewayKey,
          // Online consumer debits are WEB; business-account debits are CCD.
          ach: input.ach ? { ...input.ach, secCode: input.ach.accountHolderType === "business" ? "CCD" : "WEB" } : undefined,
        }).toString(),
        signal: AbortSignal.timeout(30000),
      })
      body = await response.text()
    } catch {
      throw this.uncertainResult()
    }
    if (!response.ok) throw this.uncertainResult()
    const result = parseTransactResponse(body)
    if (result.response === "2") {
      // Do not expose gateway raw responses, account information, or tokens.
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The payment was declined. Check your details or contact your payment provider.")
    }
    if (result.response !== "1" || !result.transactionid) throw this.uncertainResult()
    return result
  }

  private uncertainResult() {
    return new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "The gateway result could not be confirmed. Do not submit another payment or refund; contact support to check the transaction first.")
  }
}
