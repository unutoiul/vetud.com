import {
  assertNmiPaymentIdentity, getNmiSettlement, NMI_PROVIDER_ID, readNmiPaymentIdentity,
  type NmiSettlementPayment,
} from "./nmi-settlement"

export type CustomerPaymentReview = "pending_settlement" | "returned" | "requires_review" | "canceled"
export type CustomerPaymentSummary = {
  method: "nmi_card" | "nmi_ach" | "manual" | "online" | "unknown"
  review?: CustomerPaymentReview
}
export type CustomerPaymentReference = { id: string; provider_id: string }

/** Public display hints only. Never return gateway data, signatures or metadata. */
export function customerPaymentSummary(
  references: CustomerPaymentReference[],
  payments: NmiSettlementPayment[]
): CustomerPaymentSummary {
  const nmi = references.filter((payment) => payment.provider_id === NMI_PROVIDER_ID)
  if (!nmi.length) {
    return { method: !references.length ? "unknown" : references.every((payment) => payment.provider_id === "pp_system_default") ? "manual" : "online" }
  }

  const summaries = nmi.map((reference): CustomerPaymentSummary => {
    const payment = payments.find((row) => row.id === reference.id && row.provider_id === reference.provider_id)
    if (!payment) return { method: "unknown", review: "requires_review" }
    try {
      const state = readNmiPaymentIdentity(payment.data)
      assertNmiPaymentIdentity(payment, state)
      const method = state.payment_method === "ach" ? "nmi_ach" : "nmi_card"
      if (state.payment_method === "ach") {
        const settlement = getNmiSettlement(payment, state)
        if (settlement?.hold) return { method, review: "returned" }
        if (state.canceled || payment.canceled_at) return { method, review: "canceled" }
        if (settlement?.status === "settled" && settlement.capture_recorded && payment.captured_at && state.captured) return { method }
        return { method, review: payment.captured_at || state.captured ? "requires_review" : "pending_settlement" }
      }
      if (state.canceled || payment.canceled_at) return { method, review: "canceled" }
      return { method, ...(Boolean(state.captured) !== Boolean(payment.captured_at) ? { review: "requires_review" as const } : {}) }
    } catch {
      // Missing keys, unverified state or inconsistent settlement must not show
      // a reassuring "Paid" label. This does not mutate/reconcile the payment.
      return { method: "unknown", review: "requires_review" }
    }
  })

  // Mixed/partial orders must not hide a return behind another successful debit.
  for (const review of ["returned", "requires_review", "pending_settlement", "canceled"] as const) {
    const summary = summaries.find((item) => item.review === review)
    if (summary) return summary
  }
  return references.length === 1 ? summaries[0] : { method: "online" }
}
